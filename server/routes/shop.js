import { Router } from 'express';
import getDB from '../config/db.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { generateOrderNo } from '../utils/helpers.js';

const router = Router();

router.get('/products', async (req, res) => {
  try {
    const db = await getDB();
    const { category } = req.query;
    let query = `SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1`;
    const params = [];
    if (category && category !== 'all') {
      query += ' AND p.category_id = ?';
      params.push(category);
    }
    query += ' ORDER BY p.id';
    const [products] = await db.execute(query, params);
    res.json({ products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

// 获取单个商品详情
router.get('/products/:id', async (req, res) => {
  try {
    const db = await getDB();
    const [products] = await db.execute(
      `SELECT p.*, c.name as category_name, c.icon as category_icon
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );
    if (products.length === 0) {
      return res.status(404).json({ error: '商品不存在' });
    }
    res.json({ product: products[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

// 获取相关推荐商品（同类别，排除当前商品）
router.get('/products/:id/related', async (req, res) => {
  try {
    const db = await getDB();
    const [products] = await db.execute(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = (SELECT category_id FROM products WHERE id = ?)
         AND p.id != ?
         AND p.is_active = 1
       ORDER BY RAND()
       LIMIT 4`,
      [req.params.id, req.params.id]
    );
    res.json({ products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取推荐商品失败' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const db = await getDB();
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY display_order');
    res.json({ categories });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取分类失败' });
  }
});

router.post('/checkout', authRequired, async (req, res) => {
  let conn;
  try {
    const db = await getDB();
    const { items, receiver, phone, province, city, district, address, remark } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: '购物车为空' });
    }
    if (!receiver || !phone || !address) {
      return res.status(400).json({ error: '请填写完整的收货信息' });
    }

    const orderNo = generateOrderNo();
    let totalAmount = 0;

    for (const item of items) {
      totalAmount += item.price * item.quantity;
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO orders (order_no, user_id, receiver, phone, province, city, district, address, remark, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待付款')`,
      [orderNo, req.user.id, receiver, phone, province, city, district, address, remark || '', totalAmount]
    );

    const [orderResult] = await conn.execute('SELECT LAST_INSERT_ID() as orderId');
    const orderId = orderResult[0].orderId;

    for (const item of items) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, image, spec, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.image || '', item.spec || '', item.quantity, item.price, item.price * item.quantity]
      );
    }

    await conn.commit();
    res.json({ orderNo, orderId, totalAmount });
  } catch (e) {
    if (conn) {
      try { await conn.rollback(); } catch {}
    }
    console.error(e);
    res.status(500).json({ error: '创建订单失败' });
  } finally {
    if (conn) conn.release();
  }
});

router.get('/orders/all', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT o.*, u.username FROM orders o LEFT JOIN userlist u ON o.user_id = u.id';
    const params = [];

    if (status && status !== 'all') {
      query += ' WHERE o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await db.query(query, params);

    // 一次性查出所有订单项
    let items = [];
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.ID);
      const placeholders = orderIds.map(() => '?').join(',');
      const [itemsResult] = await db.query(
        `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
        orderIds
      );
      items = itemsResult;
    }

    // 把订单项分组挂到对应订单上
    const itemMap = {};
    for (const item of items) {
      if (!itemMap[item.order_id]) itemMap[item.order_id] = [];
      itemMap[item.order_id].push(item);
    }
    for (const order of orders) {
      order.items = itemMap[order.ID] || [];
    }

    let countQuery = 'SELECT COUNT(*) as total FROM orders o';
    const countParams = [];
    if (status && status !== 'all') {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      orders,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/orders/:orderNo', async (req, res) => {
  try {
    const db = await getDB();
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE order_no = ?',
      [req.params.orderNo]
    );
    if (orders.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orders[0].ID]
    );

    res.json({ order: orders[0], items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

router.get('/orders', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [req.user.id];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await db.query(query, params);

    // 一次性查出所有订单项
    let items = [];
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.ID);
      const placeholders = orderIds.map(() => '?').join(',');
      const [itemsResult] = await db.query(
        `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
        orderIds
      );
      items = itemsResult;
    }

    // 把订单项分组挂到对应订单上
    const itemMap = {};
    for (const item of items) {
      if (!itemMap[item.order_id]) itemMap[item.order_id] = [];
      itemMap[item.order_id].push(item);
    }
    for (const order of orders) {
      order.items = itemMap[order.ID] || [];
    }

    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const countParams = [req.user.id];
    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      orders,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.post('/orders/:orderNo/confirm-payment', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const [result] = await db.execute(
      "UPDATE orders SET status = '已付款' WHERE order_no = ? AND status = '待付款'",
      [req.params.orderNo]
    );
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: '订单状态异常或已支付' });
    }
    res.json({ message: '支付确认成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '支付确认失败' });
  }
});

router.post('/orders/:orderNo/confirm', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const [result] = await db.execute(
      "UPDATE orders SET status = '已完成' WHERE order_no = ? AND status = '已发货'",
      [req.params.orderNo]
    );
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: '订单状态异常或未发货' });
    }
    res.json({ message: '确认收货成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '确认收货失败' });
  }
});

// 删除订单（仅管理员）
router.delete('/orders/:orderNo', adminRequired, async (req, res) => {
  console.log('[删除订单] 接收到请求, orderNo:', req.params.orderNo);
  console.log('[删除订单] req.user:', req.user);
  try {
    const db = await getDB();
    const [orders] = await db.execute('SELECT ID FROM orders WHERE order_no = ?', [req.params.orderNo]);
    console.log('[删除订单] 查找到的订单:', orders);
    if (orders.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }
    const orderId = orders[0].ID;
    console.log('[删除订单] 开始删除订单项, orderId:', orderId);
    await db.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    console.log('[删除订单] 开始删除订单');
    await db.execute('DELETE FROM orders WHERE order_no = ?', [req.params.orderNo]);
    console.log('[删除订单] 删除成功');
    res.json({ message: '订单删除成功' });
  } catch (e) {
    console.error('[删除订单] 错误:', e);
    res.status(500).json({ error: '删除订单失败: ' + e.message });
  }
});

export default router;
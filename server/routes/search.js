import { Router } from 'express';
import getDB from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDB();
    const keyword = req.query.keyword || '';
    const searchTerm = `%${keyword}%`;

    if (!keyword || keyword.length < 2) {
      return res.json({ posts: [], products: [], culture: [] });
    }

    // 搜索帖子
    const [posts] = await db.execute(
      `SELECT p.post_id as id, p.comment as title, p.comment as content, p.createtime as createdAt,
              u.username as author, 'post' as type
       FROM posts p JOIN userlist u ON p.id = u.id
       WHERE p.status = 1 AND p.comment LIKE ?
       ORDER BY p.createtime DESC LIMIT 5`,
      [searchTerm]
    );

    // 搜索商品
    const [products] = await db.execute(
      `SELECT p_id as id, p_name as name, p_desc as description, p_price as price, 'product' as type
       FROM product
       WHERE p_status = 1 AND (p_name LIKE ? OR p_desc LIKE ?)
       ORDER BY p_id DESC LIMIT 5`,
      [searchTerm, searchTerm]
    );

    // 搜索非遗文化内容（从posts中筛选文化相关）
    const [culture] = await db.execute(
      `SELECT p.post_id as id, p.comment as title, p.comment as content, 'culture' as type
       FROM posts p
       WHERE p.status = 1 AND p.comment LIKE ?
       ORDER BY p.createtime DESC LIMIT 3`,
      [searchTerm]
    );

    res.json({ posts, products, culture });
  } catch (e) {
    console.error('搜索失败:', e);
    res.json({ posts: [], products: [], culture: [] });
  }
});

export default router;
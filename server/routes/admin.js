import { Router } from 'express';
import getDB from '../config/db.js';
import { adminRequired } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/users', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const [users] = await db.execute(
      'SELECT id, username, phone, email, is_admin, created_at FROM userlist ORDER BY id'
    );
    res.json({ users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.post('/users', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { username, password, phone, email, is_admin } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const [existing] = await db.execute('SELECT id FROM userlist WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.execute(
      'INSERT INTO userlist (username, password, phone, email, is_admin) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, phone || '', email || '', is_admin ? 1 : 0]
    );
    
    res.json({ message: '用户添加成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '添加用户失败' });
  }
});

router.put('/users/:id/password', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: '新密码不能为空' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [result] = await db.execute(
      'UPDATE userlist SET password = ? WHERE id = ?',
      [hashedPassword, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ message: '密码修改成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '修改密码失败' });
  }
});

router.put('/users/:id/role', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { is_admin } = req.body;
    const [result] = await db.execute(
      'UPDATE userlist SET is_admin = ? WHERE id = ?',
      [is_admin ? 1 : 0, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ message: '用户角色已更新' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/users/:id', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const [result] = await db.execute('DELETE FROM userlist WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
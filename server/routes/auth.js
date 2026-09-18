import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getDB from '../config/db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const db = await getDB();
    const { username, password, phone, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    const [existing] = await db.execute('SELECT id FROM userlist WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO userlist (username, password, phone, email) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, phone || '', email || '']
    );
    const [result] = await db.execute('SELECT LAST_INSERT_ID() as id');
    const userId = result[0].id;
    const token = jwt.sign(
      { id: userId, username, is_admin: 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: userId, username, is_admin: 0 } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const db = await getDB();
    const { username, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM userlist WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const db = await getDB();
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.json({ user: null });
    }
    const token = header.split(' ')[1];
    let user;
    if (token.startsWith('demo_')) {
      // 兼容 demo token
      user = JSON.parse(atob(token.slice(5)));
    } else {
      const decoded = jwt.verify(token, JWT_SECRET);
      const [rows] = await db.execute(
        'SELECT id, username, phone, email, is_admin FROM userlist WHERE id = ?',
        [decoded.id]
      );
      if (rows.length === 0) {
        return res.json({ user: null });
      }
      user = rows[0];
    }
    res.json({ user });
  } catch (e) {
    console.error('/me error:', e.message);
    res.json({ user: null });
  }
});

export default router;
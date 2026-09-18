import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'feiyi_culture_jwt_secret_2024';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  const token = header.split(' ')[1];
  try {
    if (token.startsWith('demo_')) {
      // 兼容前端 demo token
      const user = JSON.parse(atob(token.slice(5)));
      req.user = user;
    } else {
      // 正常 JWT token
      req.user = jwt.verify(token, JWT_SECRET);
    }
    next();
  } catch (e) {
    console.error('Auth error:', e.message);
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export function adminRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  const token = header.split(' ')[1];
  try {
    if (token.startsWith('demo_')) {
      const user = JSON.parse(atob(token.slice(5)));
      req.user = user;
    } else {
      req.user = jwt.verify(token, JWT_SECRET);
    }
    if (!req.user || req.user.is_admin !== 1 && req.user.is_admin !== true) {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  } catch (e) {
    console.error('Admin auth error:', e.message);
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export { JWT_SECRET };
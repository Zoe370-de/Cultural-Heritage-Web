import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

// 确保上传目录存在
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 上传图片（base64格式）
router.post('/image', authRequired, async (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ error: '请提供图片数据' });
    }

    // 从base64中提取图片数据
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: '图片格式不正确' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 限制文件大小（5MB）
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: '图片大小不能超过5MB' });
    }

    // 生成唯一文件名
    const name = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, name);
    
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${name}`;
    res.json({ url, message: '上传成功' });
  } catch (e) {
    console.error('上传失败:', e);
    res.status(500).json({ error: '上传失败' });
  }
});

export default router;
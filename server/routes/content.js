import { Router } from 'express';
import getDB from '../config/db.js';

const router = Router();

router.get('/danmaku', async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute(
      'SELECT content, color, speed FROM danmaku WHERE is_active = 1 ORDER BY RAND() LIMIT 30'
    );
    res.json({ danmaku: rows });
  } catch (e) {
    res.json({
      danmaku: [
        { content: '中国拥有10000+项国家级非遗项目 🌏', color: '#B22222', speed: 10 },
        { content: '苏绣可以把一根丝线劈成1/128根使用 🪡', color: '#DAA520', speed: 8 },
        { content: '景德镇制瓷技艺已传承1300年 🏺', color: '#B22222', speed: 9 },
        { content: '京剧被誉为中国国粹 🎭', color: '#DAA520', speed: 7 },
        { content: '剪纸艺术一把剪刀剪出万千世界 ✂️', color: '#B22222', speed: 11 },
        { content: '蜀绣针法多达12种 🌈', color: '#DAA520', speed: 8 },
        { content: '端午节被列入人类非遗代表作名录 🟢', color: '#B22222', speed: 10 },
        { content: '昆曲是百戏之祖 🎵', color: '#DAA520', speed: 9 },
        { content: '景泰蓝又称铜胎掐丝珐琅 🎨', color: '#B22222', speed: 12 },
        { content: '古琴是中国最早的弹拨乐器 🎶', color: '#DAA520', speed: 8 },
        { content: '宣纸被称为纸中之王 📜', color: '#B22222', speed: 10 },
        { content: '皮影戏是最早的动画形式 🎬', color: '#DAA520', speed: 9 },
        { content: '中国结象征吉祥如意 🧧', color: '#B22222', speed: 7 },
        { content: '榫卯结构不用一颗钉子 🔨', color: '#DAA520', speed: 11 },
        { content: '普洱茶越陈越香 🍵', color: '#B22222', speed: 8 }
      ]
    });
  }
});

router.get('/culture/:section', async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute(
      'SELECT title, content, icon, image_url FROM culture_content WHERE section = ? AND is_active = 1 ORDER BY display_order',
      [req.params.section]
    );
    res.json({ items: rows });
  } catch (e) {
    res.json({ items: [] });
  }
});

router.get('/questions', async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute(
      'SELECT id, question, option_a, option_b, option_c, option_d, answer FROM questions ORDER BY display_order'
    );
    const questions = rows.map(r => ({
      id: r.id,
      question: r.question,
      options: [r.option_a, r.option_b, r.option_c, r.option_d],
      answer: r.answer
    }));
    res.json({ questions });
  } catch (e) {
    res.json({
      questions: [
        { id: 1, question: '景泰蓝属于哪种工艺？', options: ['陶瓷工艺', '金属工艺', '纺织工艺', '木雕工艺'], answer: 1 },
        { id: 2, question: '以下哪个属于传统美术类非遗？', options: ['剪纸', '京剧', '皮影戏', '古琴'], answer: 0 },
        { id: 3, question: '苏绣起源于哪个省份？', options: ['四川', '广东', '江苏', '浙江'], answer: 2 },
        { id: 4, question: '景德镇以哪种瓷器闻名？', options: ['青瓷', '白瓷', '青花瓷', '黑瓷'], answer: 2 },
        { id: 5, question: '京剧脸谱中红色代表什么性格？', options: ['奸诈', '正直', '勇猛', '忠诚'], answer: 3 }
      ]
    });
  }
});

router.get('/nav', async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute(
      'SELECT menu_name, menu_url, menu_order FROM nav_menu WHERE is_active = 1 ORDER BY menu_order'
    );
    res.json({ nav: rows });
  } catch (e) {
    res.json({ nav: [] });
  }
});

router.get('/overview', async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute(
      'SELECT icon, title, description, link_url FROM culture_overview WHERE is_active = 1 ORDER BY display_order'
    );
    res.json({ features: rows });
  } catch (e) {
    res.json({ features: [] });
  }
});

export default router;
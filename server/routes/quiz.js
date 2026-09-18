import { Router } from 'express';
import getDB from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// mysql2 对 JSON 列可能已解析为对象，也可能返回字符串，做兼容处理
function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

// 获取用户游戏进度
router.get('/progress', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute('SELECT * FROM game_progress WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.json({ progress: null });
    }
    const p = rows[0];
    res.json({
      progress: {
        score: p.score,
        levelStars: parseJson(p.level_stars, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }),
        unlockedLevels: p.unlocked_levels,
        maxCombo: p.max_combo,
        visitedRegions: parseJson(p.visited_regions, []),
        artisanTitle: p.artisan_title
      }
    });
  } catch (e) {
    console.error('/quiz/progress error:', e.message);
    res.status(500).json({ error: '获取游戏进度失败' });
  }
});

// 保存用户游戏进度
router.put('/progress', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { score, levelStars, unlockedLevels, maxCombo, visitedRegions, artisanTitle } = req.body;
    const levelStarsJson = JSON.stringify(levelStars || {});
    const visitedRegionsJson = JSON.stringify(visitedRegions || []);
    await db.execute(
      `INSERT INTO game_progress (user_id, score, level_stars, unlocked_levels, max_combo, visited_regions, artisan_title)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         score = VALUES(score),
         level_stars = VALUES(level_stars),
         unlocked_levels = VALUES(unlocked_levels),
         max_combo = VALUES(max_combo),
         visited_regions = VALUES(visited_regions),
         artisan_title = VALUES(artisan_title)`,
      [req.user.id, score || 0, levelStarsJson, unlockedLevels || 1, maxCombo || 0, visitedRegionsJson, artisanTitle || '初级学徒']
    );
    res.json({ message: '进度已保存' });
  } catch (e) {
    console.error('/quiz/progress PUT error:', e.message);
    res.status(500).json({ error: '保存进度失败' });
  }
});

// 获取用户错题
router.get('/wrong-questions', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute(
      'SELECT question_id, question_data, user_answer, wrong_count, last_wrong_time FROM wrong_questions WHERE user_id = ? ORDER BY last_wrong_time DESC',
      [req.user.id]
    );
    const wrongQuestions = rows.map((r) => ({
      ...parseJson(r.question_data, {}),
      userAnswer: r.user_answer == null ? null : parseJson(r.user_answer, null),
      wrongCount: r.wrong_count,
      lastWrongTime: new Date(r.last_wrong_time).getTime()
    }));
    res.json({ wrongQuestions });
  } catch (e) {
    console.error('/quiz/wrong-questions error:', e.message);
    res.status(500).json({ error: '获取错题失败' });
  }
});

// 新增或更新错题
router.post('/wrong-questions', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { questionId, questionData, userAnswer, wrongCount } = req.body;
    if (!questionId || !questionData) {
      return res.status(400).json({ error: '参数不完整' });
    }
    await db.execute(
      `INSERT INTO wrong_questions (user_id, question_id, question_data, user_answer, wrong_count)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         question_data = VALUES(question_data),
         user_answer = VALUES(user_answer),
         wrong_count = VALUES(wrong_count),
         last_wrong_time = CURRENT_TIMESTAMP`,
      [req.user.id, questionId, JSON.stringify(questionData), JSON.stringify(userAnswer ?? null), wrongCount || 1]
    );
    res.json({ message: '错题已记录' });
  } catch (e) {
    console.error('/quiz/wrong-questions POST error:', e.message);
    res.status(500).json({ error: '记录错题失败' });
  }
});

// 清空错题
router.delete('/wrong-questions', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    await db.execute('DELETE FROM wrong_questions WHERE user_id = ?', [req.user.id]);
    res.json({ message: '错题已清空' });
  } catch (e) {
    console.error('/quiz/wrong-questions DELETE error:', e.message);
    res.status(500).json({ error: '清空错题失败' });
  }
});

// 删除单条错题
router.delete('/wrong-questions/:questionId', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    await db.execute('DELETE FROM wrong_questions WHERE user_id = ? AND question_id = ?', [req.user.id, req.params.questionId]);
    res.json({ message: '错题已删除' });
  } catch (e) {
    console.error('/quiz/wrong-questions/:id DELETE error:', e.message);
    res.status(500).json({ error: '删除错题失败' });
  }
});

export default router;
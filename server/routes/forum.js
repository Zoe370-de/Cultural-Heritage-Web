import { Router } from 'express';
import getDB from '../config/db.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { containsBannedWords, loadBannedWords } from '../utils/banned-words.js';

const router = Router();

// 延迟加载禁止词，避免模块加载时的异步问题
let bannedWordsLoaded = false;
async function ensureBannedWordsLoaded() {
  if (!bannedWordsLoaded) {
    const db = await getDB();
    await loadBannedWords(db);
    bannedWordsLoaded = true;
  }
}

router.get('/posts', async (req, res) => {
  try {
    const db = await getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const showAll = req.query.all === '1';

    console.log('Fetching posts - page:', page, 'limit:', limit, 'offset:', offset, 'showAll:', showAll);
    
    let posts, countResult;
    
    if (showAll) {
      [posts] = await db.execute(
        `SELECT p.post_id, p.comment, p.createtime, p.status,
                u.username, u.id as user_id
         FROM posts p JOIN userlist u ON p.id = u.id
         ORDER BY p.createtime DESC
         LIMIT ${limit} OFFSET ${offset}`
      );
      [countResult] = await db.execute('SELECT COUNT(*) as total FROM posts p');
    } else {
      const userId = req.user?.id || 0;
      [posts] = await db.execute(
        `SELECT p.post_id, p.comment, p.createtime, p.status,
                u.username, u.id as user_id
         FROM posts p JOIN userlist u ON p.id = u.id
         WHERE p.status = 1 OR p.id = ?
         ORDER BY p.createtime DESC
         LIMIT ${limit} OFFSET ${offset}`,
        [userId]
      );
      [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM posts p WHERE p.status = 1 OR p.id = ?',
        [userId]
      );
    }

    console.log('Posts fetched:', posts.length, 'total:', countResult[0].total);

    res.json({
      posts,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (e) {
    console.error('Error fetching posts:', e.message, e.stack);
    res.status(500).json({ error: '获取帖子列表失败', details: e.message });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const db = await getDB();

    const [posts] = await db.execute(
      `SELECT p.*, u.username
       FROM posts p JOIN userlist u ON p.id = u.id
       WHERE p.post_id = ? AND p.status = 1`,
      [req.params.id]
    );
    if (posts.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const [comments] = await db.execute(
      `SELECT c.*, u.username
       FROM comments c JOIN userlist u ON c.id = u.id
       WHERE c.post_id = ? AND (c.status = 1 OR c.id = ?)
       ORDER BY c.createtime ASC`,
      [req.params.id, req.user?.id || 0]
    );

    const commentTree = [];
    const commentMap = {};
    for (const c of comments) {
      c.replies = [];
      commentMap[c.comment_id] = c;
    }
    for (const c of comments) {
      if (c.parent_comment_id && commentMap[c.parent_comment_id]) {
        commentMap[c.parent_comment_id].replies.push(c);
      } else if (!c.parent_comment_id) {
        commentTree.push(c);
      }
    }

    res.json({ post: posts[0], comments: commentTree });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取帖子详情失败' });
  }
});

// Get comments for a post
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const db = await getDB();
    const [comments] = await db.execute(
      `SELECT c.*, u.username
       FROM comments c JOIN userlist u ON c.id = u.id
       WHERE c.post_id = ? AND (c.status = 1 OR c.id = ?)
       ORDER BY c.createtime ASC`,
      [req.params.id, req.user?.id || 0]
    );
    const commentTree = [];
    const commentMap = {};
    for (const c of comments) { c.replies = []; commentMap[c.comment_id] = c; }
    for (const c of comments) {
      if (c.parent_comment_id && commentMap[c.parent_comment_id]) {
        commentMap[c.parent_comment_id].replies.push(c);
      } else if (!c.parent_comment_id) {
        commentTree.push(c);
      }
    }
    res.json({ comments: commentTree });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取评论失败' });
  }
});

router.post('/posts', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '内容不能为空' });
    }
    if (content.length > 500) {
      return res.status(400).json({ error: '内容不能超过500字' });
    }
    await ensureBannedWordsLoaded();
    if (containsBannedWords(content)) {
      return res.status(400).json({ error: '内容包含违规词汇，请修改后重新提交' });
    }

    await db.execute(
      'INSERT INTO posts (id, comment, createtime, status) VALUES (?, ?, CURRENT_TIMESTAMP, 0)',
      [req.user.id, content.trim()]
    );
    const [result] = await db.execute('SELECT LAST_INSERT_ID() as post_id');
    res.json({ post_id: result[0].post_id, message: '发布成功，等待审核' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '发帖失败' });
  }
});

router.post('/comments', authRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { postId, content, parentCommentId } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }
    if (content.length > 500) {
      return res.status(400).json({ error: '评论不能超过500字' });
    }
    await ensureBannedWordsLoaded();
    if (containsBannedWords(content)) {
      return res.status(400).json({ error: '评论包含违规词汇' });
    }

    const [posts] = await db.execute('SELECT post_id FROM posts WHERE post_id = ? AND status = 1', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    if (parentCommentId) {
      const [parent] = await db.execute('SELECT comment_id FROM comments WHERE comment_id = ? AND post_id = ?', [parentCommentId, postId]);
      if (parent.length === 0) {
        return res.status(400).json({ error: '回复的评论不存在' });
      }
    }

    await db.execute(
      'INSERT INTO comments (post_id, id, parent_comment_id, comment, createtime, status) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0)',
      [postId, req.user.id, parentCommentId || null, content.trim()]
    );
    const [result] = await db.execute('SELECT LAST_INSERT_ID() as comment_id');
    res.json({ comment_id: result[0].comment_id, message: '评论成功，等待审核' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '评论失败' });
  }
});

router.put('/admin/audit/:type/:id', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { type, id } = req.params;
    const { status, reason } = req.body;
    const table = type === 'post' ? 'posts' : 'comments';
    const idField = type === 'post' ? 'post_id' : 'comment_id';

    await db.execute(
      `UPDATE ${table} SET status = ?, audit_reason = ?, audit_time = CURRENT_TIMESTAMP, audit_id = ? WHERE ${idField} = ?`,
      [status, reason || '', req.user.id, id]
    );
    res.json({ message: '审核完成' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '审核失败' });
  }
});

router.delete('/admin/:type/:id', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const { type, id } = req.params;
    const table = type === 'post' ? 'posts' : 'comments';
    const idField = type === 'post' ? 'post_id' : 'comment_id';

    await db.execute(`DELETE FROM ${table} WHERE ${idField} = ?`, [id]);
    res.json({ message: '删除成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '删除失败' });
  }
});

router.get('/admin/pending', adminRequired, async (req, res) => {
  try {
    const db = await getDB();
    const [posts] = await db.execute(
      `SELECT p.post_id, p.comment, p.createtime, p.status, u.username
       FROM posts p JOIN userlist u ON p.id = u.id
       WHERE p.status = 0 ORDER BY p.createtime DESC`
    );
    const [comments] = await db.execute(
      `SELECT c.comment_id, c.comment, c.createtime, c.status, u.username, c.post_id
       FROM comments c JOIN userlist u ON c.id = u.id
       WHERE c.status = 0 ORDER BY c.createtime DESC`
    );
    res.json({ pendingPosts: posts, pendingComments: comments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '获取待审核列表失败' });
  }
});

export default router;
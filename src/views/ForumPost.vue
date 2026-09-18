<template>
  <div class="forum-post">
    <section class="page-header">
      <div class="container">
        <router-link to="/community" class="back-link">← 返回论坛</router-link>
        <h1>帖子详情</h1>
      </div>
    </section>

    <section class="post-detail">
      <div class="container">
        <div v-if="loading" class="loading-state"><SkeletonLoader type="detail" /></div>

        <div v-else-if="post" class="post-main card">
          <div class="post-header">
            <span class="post-author">👤 {{ post.username }}</span>
            <span class="post-time">{{ formatTime(post.createtime) }}</span>
            <div class="post-actions">
              <button class="btn-share" @click="toggleShare" title="分享">
                {{ shareVisible ? '✕ 关闭' : '📤 分享' }}
              </button>
            </div>
          </div>
          <div v-if="shareVisible" class="share-panel">
            <div class="share-title">分享此帖</div>
            <div class="share-options">
              <button class="share-option" @click="copyShareLink">
                <span class="share-icon">📋</span>
                <span>{{ shareCopied ? '已复制！' : '复制链接' }}</span>
              </button>
              <button class="share-option" @click="shareToWechat">
                <span class="share-icon">💬</span>
                <span>微信分享</span>
              </button>
            </div>
            <div class="share-link-box">
              <input :value="shareUrl" readonly class="share-link-input" @focus="$event.target.select()" />
            </div>
          </div>
          <div class="post-body" v-html="formatContent(post.comment)"></div>
        </div>

        <div v-if="post" class="comments-section">
          <h3>评论 ({{ totalComments }})</h3>

          <div v-if="authStore.isLoggedIn" class="comment-form card">
            <textarea
              v-model="commentText"
              placeholder="写下你的评论..."
              maxlength="500"
            ></textarea>
            <div class="comment-form-footer">
              <span>{{ commentText.length }}/500</span>
              <button class="btn btn-primary" @click="submitComment()" :disabled="!commentText.trim()">
                发表评论
              </button>
            </div>
          </div>
          <div v-else class="comment-login-hint card">
            <p>请先 <a href="#" @click.prevent="showLoginModal">登录</a> 后发表评论</p>
          </div>

          <div v-if="comments.length === 0" class="no-comments">
            <p>暂无评论，来说两句吧！</p>
          </div>

          <div v-else class="comments-list">
            <CommentItem
              v-for="comment in comments"
              :key="comment.comment_id"
              :comment="comment"
              :depth="0"
              @reply="startReply"
            />
          </div>
        </div>
      </div>
    </section>

    <LoginModal :show="showLogin" @close="showLogin = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { getPost, createComment } from '../api/forum.js';
import LoginModal from '../components/LoginModal.vue';
import SkeletonLoader from '../components/SkeletonLoader.vue';

const showMessage = (message, type = 'info') => {
  const colors = {
    success: '#27AE60',
    error: '#E74C3C',
    warning: '#F39C12',
    info: '#4A90A4'
  }
  const div = document.createElement('div')
  div.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideDown 0.3s ease;
  `
  div.textContent = message
  document.body.appendChild(div)
  setTimeout(() => {
    div.style.opacity = '0'
    div.style.transition = 'opacity 0.3s ease'
    setTimeout(() => div.remove(), 300)
  }, 3000)
}

const route = useRoute();
const authStore = useAuthStore();
const postId = parseInt(route.params.postId);
const loading = ref(true);
const commentText = ref('');
const post = ref(null);
const comments = ref([]);
const showLogin = ref(false);
const shareVisible = ref(false);
const shareCopied = ref(false);
const shareUrl = computed(() => window.location.href);

const totalComments = computed(() => {
  const count = (list) => { let n = 0; for (const c of list) { n++; if (c.replies) n += count(c.replies); } return n; };
  return count(comments.value);
});

const replyToCommentId = ref(null);

const showLoginModal = () => {
  showLogin.value = true;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  return d.toLocaleString('zh-CN');
};

const formatContent = (content) => {
  if (!content) return '';
  // 先转义HTML
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // 转换图片标记 [图片]url
  html = html.replace(/\[图片\]([^\s]+)/g, '<img src="$1" alt="分享图片" class="post-image" />');
  // 转换换行
  html = html.replace(/\n/g, '<br>');
  return html;
};

const toggleShare = () => {
  shareVisible.value = !shareVisible.value;
  shareCopied.value = false;
};

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    shareCopied.value = true;
    setTimeout(() => { shareCopied.value = false; }, 2000);
  } catch {
    // 降级方案
    const input = document.querySelector('.share-link-input');
    if (input) { input.select(); document.execCommand('copy'); shareCopied.value = true; }
  }
};

const shareToWechat = () => {
  copyShareLink();
  showMessage('链接已复制，请打开微信粘贴分享给好友！', 'success');
};

const submitComment = async () => {
  const text = commentText.value.trim()
  if (!text) return
  if (!authStore.isLoggedIn) { 
    showMessage('请先登录', 'warning')
    return 
  }
  
  try {
    const { data } = await createComment(postId, text, replyToCommentId.value);
    
    const newComment = {
      comment_id: data.comment_id || Date.now(),
      post_id: postId,
      username: authStore.user.username,
      comment: text,
      createtime: new Date().toISOString(),
      parent_comment_id: replyToCommentId.value,
      status: 0,
      replies: []
    };
    
    if (replyToCommentId.value) {
      const findAndAdd = (list) => {
        for (const c of list) {
          if (c.comment_id === replyToCommentId.value) {
            c.replies = c.replies || [];
            c.replies.push(newComment);
            return true;
          }
          if (c.replies && findAndAdd(c.replies)) return true;
        }
        return false;
      };
      findAndAdd(comments.value);
    } else {
      comments.value.push(newComment);
    }
    
    commentText.value = ''
    replyToCommentId.value = null
    const ta = document.querySelector('.comment-form textarea');
    if (ta) { ta.placeholder = '写下你的评论...'; }
    showMessage('评论成功，等待审核后展示！', 'success')
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '未知错误'
    showMessage('评论失败：' + errorMsg, 'error')
  }
}

const startReply = (id) => {
  commentText.value = '';
  replyToCommentId.value = id;
  const ta = document.querySelector('.comment-form textarea');
  if (ta) { ta.focus(); ta.placeholder = '回复评论中...'; }
};

const CommentItem = defineComponent({
  name: 'CommentItem',
  props: { comment: Object, depth: Number },
  emits: ['reply'],
  setup(props, { emit }) {
    const showReply = ref(false);
    const replyText = ref('');
    
    const submitReply = async () => {
      const text = replyText.value.trim();
      if (!text) return;
      if (!authStore.isLoggedIn) { 
        showMessage('请先登录', 'warning'); 
        return; 
      }
      
      try {
        const { data } = await createComment(props.comment.post_id, text, props.comment.comment_id);
        
        const newReply = {
          comment_id: data.comment_id || Date.now(),
          post_id: props.comment.post_id,
          username: authStore.user.username,
          comment: text,
          createtime: new Date().toISOString(),
          parent_comment_id: props.comment.comment_id,
          status: 0,
          replies: []
        };
        
        props.comment.replies = props.comment.replies || [];
        props.comment.replies.push(newReply);
        
        replyText.value = '';
        showReply.value = false;
        showMessage('回复成功，等待审核后展示！', 'success');
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '未知错误';
        showMessage('回复失败：' + errorMsg, 'error');
      }
    };

    const handleReplyClick = () => {
      showReply.value = !showReply.value;
      if (showReply.value) {
        emit('reply', props.comment.comment_id);
      }
    };

    return () => h('div', { class: 'comment-item', style: { marginLeft: `${Math.min(props.depth, 4) * 24}px` } }, [
      h('div', { class: 'comment-header' }, [
        h('span', { class: 'comment-user' }, '👤 ' + (props.comment.username || '匿名')),
        h('span', { class: 'comment-time' }, formatTime(props.comment.createtime))
      ]),
      h('div', { class: 'comment-body' }, props.comment.comment),
      props.comment.status === 0 ? h('div', { class: 'pending-badge' }, '⏳ 待审核') : null,
      h('div', { class: 'comment-actions' }, [
        h('button', { class: 'reply-btn', onClick: handleReplyClick }, '回复')
      ]),
      showReply.value ? h('div', { class: 'reply-form' }, [
        h('textarea', { value: replyText.value, onInput: (e) => replyText.value = e.target.value, placeholder: '写下回复...', maxlength: 500 }),
        h('div', { class: 'reply-form-footer' }, [
          h('span', {}, replyText.value.length + '/500'),
          h('button', { class: 'btn btn-primary', style: { padding: '8px 16px', fontSize: '13px' }, disabled: !replyText.value.trim(), onClick: submitReply }, '回复')
        ])
      ]) : null,
      ...(props.comment.replies || []).map(r => h(CommentItem, { comment: r, depth: props.depth + 1 }))
    ]);
  }
});

const loadPostData = async () => {
  loading.value = true
  try { 
    const { data } = await getPost(postId);
    if (data.post) {
      post.value = data.post;
      comments.value = data.comments || [];
    } else {
      post.value = {
        post_id: postId,
        username: '匿名用户',
        comment: '该帖子不存在或已被删除',
        createtime: new Date().toLocaleString('zh-CN'),
        status: 1
      };
      comments.value = [];
    }
  } catch (error) {
    console.error('加载失败:', error);
    showMessage('加载帖子失败，请稍后重试', 'error');
    post.value = null;
    comments.value = [];
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPostData()
})
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 100px 0 40px;
  text-align: center;
}

.page-header h1 {
  font-size: 32px;
  margin-top: 10px;
}

.back-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  color: white;
}

.post-detail {
  padding: 40px 0 80px;
  background: var(--bg-light);
}

.post-main {
  padding: 30px;
  margin-bottom: 30px;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.post-author {
  font-weight: 600;
  color: var(--text-dark);
}

.post-time {
  font-size: 13px;
  color: var(--text-light);
}

.post-actions {
  margin-left: auto;
}

.btn-share {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid var(--secondary-color);
  color: var(--secondary-color);
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-share:hover {
  background: var(--secondary-color);
  color: #fff;
}

.share-panel {
  margin: 12px 0 20px;
  padding: 16px;
  background: var(--bg-light);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.share-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.share-options {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.share-option:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.share-icon {
  font-size: 16px;
}

.share-link-box {
  position: relative;
}

.share-link-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-light);
  background: #fff;
  outline: none;
}

.share-link-input:focus {
  border-color: var(--primary-color);
}

.post-body {
  font-size: 16px;
  color: var(--text-dark);
  line-height: 1.8;
}

.post-image {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: block;
}

.comments-section h3 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-dark);
}

.comment-form {
  padding: 20px;
  margin-bottom: 20px;
}

.comment-form textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.comment-form textarea:focus {
  border-color: var(--primary-color);
}

.comment-form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-light);
}

.comment-login-hint {
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}

.comment-login-hint a {
  color: var(--primary-color);
  text-decoration: none;
}

.comment-item {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.comment-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-dark);
}

.comment-time {
  font-size: 12px;
  color: var(--text-light);
}

.comment-body {
  font-size: 14px;
  color: var(--text-dark);
  line-height: 1.6;
  margin-bottom: 8px;
}

.pending-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #FFF3CD;
  color: #856404;
  font-size: 11px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  gap: 10px;
}

.reply-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 12px;
  cursor: pointer;
}

.reply-btn:hover {
  text-decoration: underline;
}

.reply-form {
  margin-top: 10px;
}

.reply-form textarea {
  width: 100%;
  min-height: 60px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.reply-form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-light);
}

.no-comments {
  text-align: center;
  padding: 40px;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 24px;
  }

  .post-body {
    font-size: 14px;
  }

  .comment-form textarea {
    min-height: 80px;
  }

  .share-panel {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 20px;
  }

  .page-header p {
    font-size: 13px;
  }

  .post-main {
    padding: 20px 15px;
  }

  .post-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .comment-item {
    padding: 12px;
  }

  .comment-form textarea {
    min-height: 60px;
    font-size: 13px;
  }

  .share-options {
    flex-direction: column;
    gap: 8px;
  }

  .container {
    padding: 0 15px;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
import { defineStore } from 'pinia';

export const useForumStore = defineStore('forumData', {
  state: () => ({
    posts: [],
    comments: [],
    currentPage: 1,
    totalPosts: 0,
    loading: false
  }),
  getters: {
    getPostById: (state) => (id) => state.posts.find(p => p.post_id === id),
    getCommentsByPostId: (state) => (postId) => {
      const raw = state.comments.filter(c => c.post_id === postId);
      return buildTree(raw);
    },
    approvedPosts: (state) => state.posts.filter(p => p.status === 1)
  },
  actions: {
    // 从后端加载帖子
    async loadPosts(page = 1, limit = 15) {
      this.loading = true;
      try {
        const { getPosts } = await import('@/api/forum.js');
        const { data } = await getPosts(page, limit);
        this.posts = data.posts || [];
        this.totalPosts = data.total || 0;
        this.currentPage = page;
        return data;
      } catch (error) {
        console.error('加载帖子失败:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 加载单个帖子详情
    async loadPost(id) {
      try {
        const { getPost } = await import('@/api/forum.js');
        const { data } = await getPost(id);
        return data;
      } catch (error) {
        console.error('加载帖子详情失败:', error);
        throw error;
      }
    },

    // 发布新帖子（调用后端API）
    async createPost(content) {
      try {
        const { createPost: apiCreatePost } = await import('@/api/forum.js');
        const { data } = await apiCreatePost(content);
        // 将新帖子添加到列表中
        if (data.post) {
          this.posts.unshift(data.post);
          this.totalPosts++;
        }
        return data;
      } catch (error) {
        console.error('发布帖子失败:', error);
        throw error;
      }
    },

    // 发表评论（调用后端API）
    async createComment(postId, content, parentCommentId = null) {
      try {
        const { createComment: apiCreateComment } = await import('@/api/forum.js');
        const { data } = await apiCreateComment(postId, content, parentCommentId);
        // 将新评论添加到列表中
        if (data.comment) {
          this.comments.push(data.comment);
        }
        return data;
      } catch (error) {
        console.error('发表评论失败:', error);
        throw error;
      }
    },

    // 加载待审核内容
    async loadPending() {
      try {
        const { getPending } = await import('@/api/forum.js');
        const { data } = await getPending();
        return data;
      } catch (error) {
        console.error('加载待审核内容失败:', error);
        throw error;
      }
    },

    // 审核帖子或评论（调用后端API）
    async audit(type, id, status, reason = '') {
      try {
        const { audit: apiAudit } = await import('@/api/forum.js');
        const { data } = await apiAudit(type, id, status, reason);
        
        // 更新本地状态
        if (type === 'post') {
          const post = this.posts.find(p => p.post_id === id);
          if (post) {
            post.status = status;
          }
        } else if (type === 'comment') {
          const comment = this.comments.find(c => c.comment_id === id);
          if (comment) {
            comment.status = status;
          }
        }
        
        return data;
      } catch (error) {
        console.error('审核失败:', error);
        throw error;
      }
    },

    // 删除帖子或评论
    async deleteItem(type, id) {
      try {
        const { deleteItem: apiDelete } = await import('@/api/forum.js');
        await apiDelete(type, id);
        
        // 从本地状态移除
        if (type === 'post') {
          this.posts = this.posts.filter(p => p.post_id !== id);
          this.totalPosts--;
        } else if (type === 'comment') {
          this.comments = this.comments.filter(c => c.comment_id !== id);
        }
      } catch (error) {
        console.error('删除失败:', error);
        throw error;
      }
    },

    // 清空本地数据
    clearData() {
      this.posts = [];
      this.comments = [];
      this.totalPosts = 0;
    }
  }
});

function buildTree(flatList) {
  const map = {};
  const tree = [];
  flatList.forEach(c => { map[c.comment_id] = { ...c, replies: [] }; });
  flatList.forEach(c => {
    if (c.parent_comment_id && map[c.parent_comment_id]) {
      map[c.parent_comment_id].replies.push(map[c.comment_id]);
    } else if (!c.parent_comment_id || !map[c.parent_comment_id]) {
      tree.push(map[c.comment_id]);
    }
  });
  return tree;
}

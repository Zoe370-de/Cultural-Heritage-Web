import api from './index.js';

export function getPosts(page = 1, limit = 15) {
  return api.get('/forum/posts', { params: { page, limit } });
}

export function getPost(id) {
  return api.get(`/forum/posts/${id}`);
}

export function getComments(postId) {
  return api.get(`/forum/posts/${postId}/comments`);
}

export function createPost(content) {
  return api.post('/forum/posts', { content });
}

export function createComment(postId, content, parentCommentId) {
  return api.post('/forum/comments', { postId, content, parentCommentId });
}

export function getPending() {
  return api.get('/forum/admin/pending');
}

export function audit(type, id, status, reason) {
  return api.put(`/forum/admin/audit/${type}/${id}`, { status, reason });
}

export function deleteItem(type, id) {
  return api.delete(`/forum/admin/${type}/${id}`);
}

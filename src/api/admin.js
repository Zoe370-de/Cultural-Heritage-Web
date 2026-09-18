import api from './index.js';

export function getUsers() {
  return api.get('/admin/users');
}

export function addUser(data) {
  return api.post('/admin/users', data);
}

export function updateUserRole(userId, isAdmin) {
  return api.put(`/admin/users/${userId}/role`, { is_admin: isAdmin });
}

export function updateUserPassword(userId, newPassword) {
  return api.put(`/admin/users/${userId}/password`, { newPassword });
}

export function deleteUser(userId) {
  return api.delete(`/admin/users/${userId}`);
}

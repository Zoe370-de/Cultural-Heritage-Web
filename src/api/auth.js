import api from './index.js';

export function login(username, password) {
  return api.post('/auth/login', { username, password });
}

export function register(username, password, phone, email) {
  return api.post('/auth/register', { username, password, phone, email });
}

export function getMe() {
  return api.get('/auth/me');
}

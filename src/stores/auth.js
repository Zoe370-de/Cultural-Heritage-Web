import { defineStore } from 'pinia';
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth.js';

const demoUsers = [
  { id: 1, username: 'admin', password: '123456', is_admin: 1, phone: '', email: '' },
  { id: 2, username: 'szh', password: '123456', is_admin: 1, phone: '', email: '' },
  { id: 3, username: 'testuser', password: '123456', is_admin: 0, phone: '', email: '' }
];

function makeToken(user) {
  return 'demo_' + btoa(JSON.stringify(user));
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || '',
    loading: false
  }),
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.is_admin === 1 || state.user?.is_admin === true
  },
  actions: {
    async login(username, password) {
      try {
        const { data } = await apiLogin(username, password);
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        return;
      } catch (e) {
        // API failed, try demo login
      }
      const demo = demoUsers.find(u => u.username === username && u.password === password);
      if (!demo) throw new Error('用户名或密码错误');
      this.token = makeToken(demo);
      this.user = { id: demo.id, username: demo.username, is_admin: demo.is_admin, phone: demo.phone, email: demo.email };
      localStorage.setItem('token', this.token);
    },
    async register(username, password, phone, email) {
      try {
        const { data } = await apiRegister(username, password, phone, email);
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        return;
      } catch (e) {
        // API failed, try demo register
      }
      if (demoUsers.find(u => u.username === username)) throw new Error('用户名已存在');
      const newUser = { id: demoUsers.length + 1, username, password, is_admin: 0, phone: phone || '', email: email || '' };
      demoUsers.push(newUser);
      this.token = makeToken(newUser);
      this.user = { id: newUser.id, username: newUser.username, is_admin: 0, phone: newUser.phone, email: newUser.email };
      localStorage.setItem('token', this.token);
    },
    async checkAuth() {
      if (!this.token) return;
      if (this.token.startsWith('demo_')) {
        try {
          const user = JSON.parse(atob(this.token.slice(5)));
          this.user = user;
        } catch (e) { this.logout(); }
        return;
      }
      try {
        const { data } = await getMe();
        if (data.user) { this.user = data.user; } else { this.logout(); }
      } catch (e) { this.logout(); }
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
    }
  }
});

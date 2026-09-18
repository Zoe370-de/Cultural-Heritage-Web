<template>
  <div class="login-overlay" v-if="show" @click.self="$emit('close')">
    <div class="login-modal">
      <button class="modal-close" @click="$emit('close')">✕</button>
      <div class="modal-header">
        <h2>{{ isLogin ? '登录' : '注册' }}</h2>
        <p>{{ isLogin ? '欢迎回来，继续探索非遗文化' : '加入我们，开启非遗探索之旅' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" required>
        </div>

        <div v-if="!isLogin" class="form-group">
          <label>手机号</label>
          <input v-model="form.phone" type="text" placeholder="请输入手机号（选填）">
        </div>

        <div v-if="!isLogin" class="form-group">
          <label>邮箱</label>
          <input v-model="form.email" type="email" placeholder="请输入邮箱（选填）">
        </div>

        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" required>
        </div>

        <div v-if="error" class="form-error">{{ error }}</div>

        <button type="submit" class="btn btn-primary modal-submit" :disabled="loading">
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <div class="modal-footer">
        <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <button class="switch-btn" @click="toggleMode">{{ isLogin ? '立即注册' : '立即登录' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '../stores/auth.js';

defineProps({ show: Boolean });
const emit = defineEmits(['close']);

const authStore = useAuthStore();
const isLogin = ref(true);
const loading = ref(false);
const error = ref('');
const form = reactive({
  username: '',
  password: '',
  phone: '',
  email: ''
});

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  error.value = '';
};

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;
  try {
    if (isLogin.value) {
      await authStore.login(form.username, form.password);
    } else {
      await authStore.register(form.username, form.password, form.phone, form.email);
    }
    emit('close');
  } catch (e) {
    error.value = e.response?.data?.error || '操作失败，请重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.login-modal {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 420px;
  max-width: 90vw;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #E74C3C;
  color: white;
}

.modal-header {
  text-align: center;
  margin-bottom: 30px;
}

.modal-header h2 {
  font-size: 24px;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.modal-header p {
  font-size: 14px;
  color: var(--text-light);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dark);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.1);
}

.form-error {
  background: rgba(231, 76, 60, 0.1);
  color: #E74C3C;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
}

.modal-submit {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-bottom: 0;
}

.modal-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-light);
}

.switch-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-left: 4px;
}

.switch-btn:hover {
  text-decoration: underline;
}
</style>

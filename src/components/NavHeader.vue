<template>
  <header class="nav-header" :class="{ 'scrolled': isScrolled }">
    <div class="container">
      <div class="nav-content">
        <div class="logo">
          <span class="logo-icon">遗</span>
          <span class="logo-text">非遗传承</span>
        </div>
        
        <!-- 搜索框 -->
        <div class="search-wrapper">
          <div class="search-box" :class="{ 'active': isSearchFocused || searchKeyword }">
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索帖子、商品、文化文章..."
              @focus="isSearchFocused = true"
              @blur="handleSearchBlur"
              @keyup.enter="performSearch"
            />
            <button v-if="searchKeyword" class="search-clear" @click="clearSearch">✕</button>
            <button v-else class="search-icon">🔍</button>
          </div>
          <div v-if="searchResults.length > 0" class="search-results">
            <div class="results-header">
              <span>搜索结果</span>
              <span class="result-count">{{ searchResults.length }} 条</span>
            </div>
            <div class="results-list">
              <div
                v-for="result in searchResults.slice(0, 8)"
                :key="result.id"
                class="result-item"
                @click="handleResultClick(result)"
              >
                <span class="result-type">{{ getResultTypeIcon(result.type) }}</span>
                <div class="result-info">
                  <span class="result-title">{{ result.title || result.name }}</span>
                  <span class="result-content">{{ result.content || result.description }}</span>
                </div>
                <span v-if="result.price" class="result-price">¥{{ result.price }}</span>
              </div>
            </div>
            <div v-if="searchResults.length > 8" class="results-more">
              还有 {{ searchResults.length - 8 }} 条结果...
            </div>
          </div>
        </div>
        
        <nav class="nav-menu">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ 'active': currentPath === item.path }"
          >
            {{ item.name }}
          </router-link>
        </nav>
        <div class="nav-actions">
          <template v-if="authStore.isLoggedIn">
            <router-link to="/profile" class="user-badge" title="个人中心">
              <span class="user-icon">👤</span>
              <span class="user-name">{{ authStore.user?.username }}</span>
            </router-link>
            <button class="logout-btn" @click="authStore.logout()" title="退出登录">退出</button>
          </template>
          <button v-else class="login-nav-btn" @click="$emit('show-login')">
            登录
          </button>
          <button class="menu-toggle" @click="toggleMenu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </div>
    <div class="mobile-menu" :class="{ 'show': isMenuOpen }">
      <!-- 移动端搜索 -->
      <div class="mobile-search">
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索..."
          @keyup.enter="performSearch"
        />
        <button class="search-icon-btn" @click="performSearch">🔍</button>
      </div>
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="mobile-link"
        @click="isMenuOpen = false"
      >
        {{ item.name }}
      </router-link>
      <template v-if="authStore.isLoggedIn">
        <router-link to="/profile" class="mobile-link" @click="isMenuOpen = false">个人中心</router-link>
      </template>
      <template v-if="!authStore.isLoggedIn">
        <a href="#" class="mobile-link" @click.prevent="$emit('show-login'); isMenuOpen = false">登录 / 注册</a>
      </template>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

defineEmits(['show-login']);

const router = useRouter();
const authStore = useAuthStore();
const isScrolled = ref(false);
const isMenuOpen = ref(false);
const currentPath = ref('/');
const searchKeyword = ref('');
const isSearchFocused = ref(false);
const searchResults = ref([]);
let searchTimeout = null;

const baseNavItems = [
  { name: '首页', path: '/' },
  { name: '匠心地图', path: '/culture' },
  { name: '互动游戏', path: '/interactive' },
  { name: '研学手记', path: '/notebook' },
  { name: '互动社区', path: '/community' },
  { name: 'AI识遗', path: '/clothing-detection' },
  { name: '文创馆', path: '/store' },
  { name: '我的订单', path: '/orders' }
];

const navItems = computed(() => {
  const items = [...baseNavItems];
  if (authStore.isAdmin) {
    items.push({ name: '管理面板', path: '/manage' });
  }
  return items;
});

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

router.afterEach((to) => {
  currentPath.value = to.path;
  isMenuOpen.value = false;
});

const handleSearchBlur = () => {
  setTimeout(() => {
    isSearchFocused.value = false;
  }, 200);
};

const clearSearch = () => {
  searchKeyword.value = '';
  searchResults.value = [];
};

const debounceSearch = async () => {
  if (!searchKeyword.value.trim() || searchKeyword.value.length < 2) {
    searchResults.value = [];
    return;
  }

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search?keyword=${encodeURIComponent(searchKeyword.value)}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const results = [];
        if (data.posts) {
          results.push(...data.posts.map(p => ({ ...p, type: 'post', id: p.id || p.post_id })));
        }
        if (data.products) {
          results.push(...data.products.map(p => ({ ...p, type: 'product', id: p.id, name: p.name || p.p_name, price: p.price || p.p_price })));
        }
        if (data.culture) {
          results.push(...data.culture.map(c => ({ ...c, type: 'culture' })));
        }
        searchResults.value = results.length > 0 ? results : generateMockResults(searchKeyword.value);
      } else {
        searchResults.value = generateMockResults(searchKeyword.value);
      }
    } catch (e) {
      searchResults.value = generateMockResults(searchKeyword.value);
    }
  }, 300);
};

const generateMockResults = (keyword) => {
  const mockData = [
    { type: 'post', id: 1, title: '京剧艺术的传承与发展', content: '京剧作为中国国粹，融合了唱念做打，是中华文化的瑰宝...', author: 'admin', createdAt: '2024-01-15' },
    { type: 'post', id: 2, title: '景德镇陶瓷之旅', content: '景德镇是中国瓷都，千年窑火不断，陶瓷文化源远流长...', author: 'traveler', createdAt: '2024-01-10' },
    { type: 'product', id: 101, name: '苏绣手工团扇', description: '手工苏绣，精美图案，传统工艺', price: 68 },
    { type: 'product', id: 102, name: '景德镇青花瓷茶杯', description: '正宗景德镇瓷器，手工绘制青花', price: 128 },
    { type: 'culture', id: 201, title: '昆曲的前世今生', content: '昆曲被誉为百戏之祖，是中国最古老的戏曲剧种之一...' },
    { type: 'culture', id: 202, title: '中国传统剪纸艺术', content: '剪纸是中国民间最普及的艺术形式之一，2009年入选人类非遗...' }
  ];
  
  return mockData.filter(item => {
    const text = (item.title || item.name || '') + ' ' + (item.content || item.description || '');
    return text.includes(keyword);
  });
};

const performSearch = () => {
  if (searchKeyword.value.trim()) {
    searchResults.value = generateMockResults(searchKeyword.value);
  }
};

const getResultTypeIcon = (type) => {
  const icons = {
    post: '📝',
    product: '📦',
    culture: '📚'
  };
  return icons[type] || '📄';
};

const handleResultClick = (result) => {
  isMenuOpen.value = false;
  clearSearch();
  
  if (result.type === 'product') {
    router.push(`/product/${result.id}`);
  } else if (result.type === 'post') {
    router.push(`/forum/${result.id}`);
  } else if (result.type === 'culture') {
    router.push(`/culture`);
  }
};

watch(searchKeyword, debounceSearch);

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<style scoped>
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(74, 144, 164, 0.1);
}

.nav-header.scrolled {
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 28px;
  color: var(--primary-color);
  font-weight: bold;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-dark);
}

/* 搜索框样式 */
.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 400px;
  margin: 0 20px;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--bg-light);
  border-radius: 25px;
  padding: 8px 15px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.search-box.active {
  background: white;
  border-color: var(--primary-color);
  box-shadow: 0 2px 15px rgba(74, 144, 164, 0.2);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--text-dark);
}

.search-input::placeholder {
  color: var(--text-light);
}

.search-icon,
.search-clear {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 5px;
  color: var(--text-light);
}

.search-clear {
  color: var(--text-dark);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  background: var(--bg-light);
}

/* 搜索结果下拉框 */
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
  border: 1px solid var(--border-color);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: var(--bg-light);
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dark);
}

.result-count {
  font-size: 12px;
  color: var(--text-light);
  font-weight: normal;
}

.results-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.result-item:hover {
  background: var(--bg-light);
}

.result-type {
  font-size: 20px;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-content {
  display: block;
  font-size: 12px;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.result-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  white-space: nowrap;
}

.results-more {
  padding: 10px 15px;
  text-align: center;
  font-size: 12px;
  color: var(--text-light);
  background: var(--bg-light);
}

.nav-menu {
  display: flex;
  gap: 6px;
}

.nav-link {
  position: relative;
  text-decoration: none;
  color: var(--text-dark);
  font-weight: 500;
  padding: 8px 13px;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--primary-color);
  background: rgba(74, 144, 164, 0.08);
}

.nav-link.active {
  color: white;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  box-shadow: 0 2px 10px rgba(74, 144, 164, 0.3);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.login-nav-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.login-nav-btn:hover {
  box-shadow: 0 4px 12px rgba(74, 144, 164, 0.3);
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-dark);
  text-decoration: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.user-badge:hover {
  background: rgba(178, 34, 34, 0.08);
  color: var(--primary-color);
}

.user-icon {
  font-size: 16px;
}

.user-name {
  font-weight: 500;
}

.logout-btn {
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
}

.logout-btn:hover {
  color: #E74C3C;
  background: rgba(231, 76, 60, 0.1);
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
}

.menu-toggle span {
  width: 25px;
  height: 2px;
  background: var(--text-dark);
  transition: all 0.3s ease;
}

.mobile-menu {
  display: none;
  background: white;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.mobile-menu.show {
  display: block;
}

.mobile-search {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background: var(--bg-light);
  border-radius: 8px;
}

.mobile-search .search-input {
  flex: 1;
  background: white;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.search-icon-btn {
  background: var(--primary-color);
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  cursor: pointer;
  color: white;
}

.mobile-link {
  display: block;
  padding: 15px 0;
  text-decoration: none;
  color: var(--text-dark);
  font-size: 18px;
  border-bottom: 1px solid var(--border-color);
  transition: color 0.3s ease;
}

.mobile-link:last-child {
  border-bottom: none;
}

.mobile-link:hover {
  color: var(--primary-color);
}

@media (max-width: 1200px) {
  .search-wrapper {
    max-width: 300px;
  }
  
  .nav-menu {
    gap: 2px;
  }
  
  .nav-link {
    padding: 6px 10px;
    font-size: 13px;
  }
}

@media (max-width: 1024px) {
  .search-wrapper {
    display: none;
  }
  
  .nav-menu {
    gap: 2px;
  }
  
  .nav-link {
    padding: 6px 10px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .nav-actions .login-nav-btn,
  .nav-actions .user-badge {
    display: none;
  }
  
  .menu-toggle {
    display: flex;
  }
  
  .mobile-search {
    display: flex;
  }
}
</style>
<template>
  <div class="profile-page">
    <section class="page-header">
      <div class="container">
        <h1>个人中心</h1>
        <p>非遗之路，传承之旅</p>
      </div>
    </section>

    <section class="profile-content">
      <div class="container">
        <!-- 用户信息卡片 -->
        <div class="profile-card card">
          <div class="profile-avatar">
            <div class="avatar-circle">
              <span class="avatar-text">{{ avatarText }}</span>
            </div>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ authStore.user?.username || '未登录' }}</h2>
            <p class="profile-meta">
              <span class="meta-item">
                <span class="meta-icon">🏅</span>
                {{ appStore.currentArtisanTitle.title }}
              </span>
              <span class="meta-divider">|</span>
              <span class="meta-item">
                <span class="meta-icon">📅</span>
                注册于 {{ registerTime }}
              </span>
            </p>
            <p class="profile-bio">传承非遗文化，守护匠心精神</p>
          </div>
          <div class="profile-actions">
            <router-link to="/orders" class="btn btn-primary">我的订单</router-link>
          </div>
        </div>

        <!-- 数据概览 -->
        <div class="stats-row">
          <div class="stat-card card">
            <div class="stat-icon">⭐</div>
            <div class="stat-num">{{ appStore.totalStars }}</div>
            <div class="stat-label">获得星星</div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon">🔓</div>
            <div class="stat-num">{{ appStore.unlockedLevels }}/6</div>
            <div class="stat-label">解锁关卡</div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon">🏆</div>
            <div class="stat-num">{{ appStore.score }}</div>
            <div class="stat-label">总得分</div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon">📝</div>
            <div class="stat-num">{{ myPosts.length }}</div>
            <div class="stat-label">发布帖子</div>
          </div>
        </div>

        <!-- 匠人成就 -->
        <div class="section-block">
          <div class="block-title">
            <span class="title-icon">🏅</span>
            <h3>匠人成就</h3>
          </div>
          <div class="achievement-card card">
            <div class="achievement-title">
              <div class="title-badge" :style="{ background: artisanGradient }">
                <span class="title-badge-icon">{{ appStore.currentArtisanTitle.icon }}</span>
              </div>
              <div class="title-detail">
                <h4>{{ appStore.currentArtisanTitle.title }}</h4>
                <p>{{ appStore.currentArtisanTitle.description }}</p>
              </div>
            </div>
            <div class="achievement-progress">
              <div class="progress-item">
                <span class="progress-label">关卡进度</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: levelProgressPercent + '%' }"></div>
                </div>
                <span class="progress-value">{{ appStore.unlockedLevels }}/6</span>
              </div>
            </div>
            <div class="level-stars-grid">
              <div
                v-for="level in 6"
                :key="level"
                class="level-star-item"
                :class="{ 'locked': level > appStore.unlockedLevels }"
              >
                <div class="level-icon-circle" :style="{ background: level <= appStore.unlockedLevels ? appStore.levelConfig[level]?.color : '#ccc' }">
                  {{ level <= appStore.unlockedLevels ? appStore.levelConfig[level]?.icon : '🔒' }}
                </div>
                <div class="level-star-name">{{ appStore.levelConfig[level]?.name }}</div>
                <div class="level-star-rating">
                  <span v-for="s in 3" :key="s" class="star" :class="{ 'filled': s <= appStore.levelStars[level] }">
                    {{ s <= appStore.levelStars[level] ? '★' : '☆' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的非遗足迹 -->
        <div class="section-block">
          <div class="block-title">
            <span class="title-icon">🗺️</span>
            <h3>我的非遗足迹</h3>
          </div>
          <div v-if="visitedRegions.length === 0" class="empty-card card">
            <div class="empty-icon">🌍</div>
            <p>还没有点亮任何非遗城市</p>
            <router-link to="/interactive" class="btn btn-primary">去闯关</router-link>
          </div>
          <div v-else class="regions-grid">
            <div
              v-for="region in visitedRegions"
              :key="region"
              class="region-card card"
            >
              <div class="region-header">
                <span class="region-icon">📍</span>
                <span class="region-name">{{ formatRegionName(region) }}</span>
              </div>
              <div class="region-items" v-if="getRegionItems(region).length">
                <span
                  v-for="item in getRegionItems(region)"
                  :key="item"
                  class="region-tag"
                >{{ item }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的帖子 -->
        <div class="section-block">
          <div class="block-title">
            <span class="title-icon">📝</span>
            <h3>我的帖子</h3>
          </div>
          <div v-if="myPosts.length === 0" class="empty-card card">
            <div class="empty-icon">💬</div>
            <p>还没有发布过帖子</p>
            <router-link to="/community" class="btn btn-primary">去发帖</router-link>
          </div>
          <div v-else class="post-list">
            <div
              v-for="post in myPosts"
              :key="post.post_id"
              class="post-card card"
              @click="goToPost(post.post_id)"
            >
              <div class="post-time">{{ post.createtime }}</div>
              <div class="post-text" v-html="formatContent(post.comment)"></div>
              <div class="post-footer">
                <span class="post-status" v-if="post.status === 0">⏳ 待审核</span>
                <span class="post-action">查看详情 →</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷入口 -->
        <div class="section-block">
          <div class="block-title">
            <span class="title-icon">🔗</span>
            <h3>快捷入口</h3>
          </div>
          <div class="quick-links">
            <router-link to="/orders" class="quick-link-card card">
              <span class="quick-link-icon">📦</span>
              <span class="quick-link-text">我的订单</span>
              <span class="quick-link-arrow">→</span>
            </router-link>
            <router-link to="/notebook" class="quick-link-card card">
              <span class="quick-link-icon">📜</span>
              <span class="quick-link-text">研学手记</span>
              <span class="quick-link-arrow">→</span>
            </router-link>
            <router-link to="/interactive" class="quick-link-card card">
              <span class="quick-link-icon">🎮</span>
              <span class="quick-link-text">闯关挑战</span>
              <span class="quick-link-arrow">→</span>
            </router-link>
            <router-link to="/community" class="quick-link-card card">
              <span class="quick-link-icon">💬</span>
              <span class="quick-link-text">互动社区</span>
              <span class="quick-link-arrow">→</span>
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAppStore } from '../stores/app.js'
import { useForumStore } from '../stores/forum.js'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const forumStore = useForumStore()

const myPosts = ref([])

const avatarText = computed(() => {
  if (!authStore.user?.username) return '?'
  return authStore.user.username.charAt(0).toUpperCase()
})

const registerTime = computed(() => {
  const stored = localStorage.getItem('registerTime')
  if (stored) return stored
  const now = new Date().toISOString().split('T')[0]
  localStorage.setItem('registerTime', now)
  return now
})

const levelProgressPercent = computed(() => {
  return Math.round(((appStore.unlockedLevels - 1) / 5) * 100)
})

const artisanGradient = computed(() => {
  const level = appStore.unlockedLevels
  if (level >= 5) return 'linear-gradient(135deg, #DAA520, #B8860B)'
  if (level >= 3) return 'linear-gradient(135deg, #B22222, #8B4513)'
  return 'linear-gradient(135deg, #8B7355, #6B5B3D)'
})

const visitedRegions = computed(() => {
  return appStore.visitedRegions
})

function formatRegionName(region) {
  if (!region) return ''
  const parts = region.split(' ')
  return parts.length > 1 ? parts.slice(1).join('') : region
}

function getRegionItems(region) {
  return appStore.regionMap[region]?.items || []
}

function formatContent(content) {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

function goToPost(postId) {
  router.push(`/forum/${postId}`)
}

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      await forumStore.loadPosts(1, 100)
      const username = authStore.user?.username
      myPosts.value = forumStore.posts.filter(
        p => p.username === username
      )
    } catch (e) {
      console.error('加载帖子失败:', e)
    }
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg-light);
}

.page-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  padding: 80px 0 40px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 25 L30 20 L25 25 Z' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E");
  opacity: 0.5;
}

.page-header h1 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  position: relative;
}

.page-header p {
  font-size: 16px;
  opacity: 0.9;
  position: relative;
}

.profile-content {
  padding: 40px 0 60px;
}

/* 用户信息卡片 */
.profile-card {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 40px;
  margin-top: -80px;
  position: relative;
  z-index: 1;
  background: white;
  flex-wrap: wrap;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(178, 34, 34, 0.3);
}

.avatar-text {
  font-size: 42px;
  font-weight: 700;
  color: white;
}

.profile-info {
  flex: 1;
  min-width: 200px;
}

.profile-name {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.profile-meta {
  font-size: 14px;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 16px;
}

.meta-divider {
  color: var(--border-color);
}

.profile-bio {
  font-size: 14px;
  color: var(--text-light);
  font-style: italic;
}

.profile-actions {
  flex-shrink: 0;
}

/* 数据概览 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 30px;
}

.stat-card {
  padding: 24px;
  text-align: center;
  background: white;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
}

/* 区块标题 */
.section-block {
  margin-top: 40px;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.block-title .title-icon {
  font-size: 24px;
}

.block-title h3 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-dark);
  position: relative;
}

/* 匠人成就 */
.achievement-card {
  padding: 30px;
  background: white;
}

.achievement-title {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.title-badge {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-badge-icon {
  font-size: 36px;
}

.title-detail h4 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.title-detail p {
  font-size: 14px;
  color: var(--text-light);
}

.achievement-progress {
  margin-bottom: 25px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-label {
  font-size: 14px;
  color: var(--text-dark);
  font-weight: 500;
  white-space: nowrap;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: var(--bg-light);
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 5px;
  transition: width 0.6s ease;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  white-space: nowrap;
}

.level-stars-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.level-star-item {
  text-align: center;
  padding: 15px 10px;
  border-radius: 12px;
  background: var(--bg-light);
  transition: all 0.3s ease;
}

.level-star-item.locked {
  opacity: 0.5;
}

.level-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  font-size: 20px;
}

.level-star-name {
  font-size: 12px;
  color: var(--text-dark);
  font-weight: 500;
  margin-bottom: 4px;
}

.level-star-rating {
  font-size: 14px;
}

.star {
  color: #ddd;
}

.star.filled {
  color: #F39C12;
}

/* 非遗足迹 */
.empty-card {
  padding: 50px 30px;
  text-align: center;
  background: white;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-card p {
  font-size: 16px;
  color: var(--text-light);
  margin-bottom: 20px;
}

.regions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.region-card {
  padding: 20px;
  background: white;
  cursor: default;
}

.region-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.region-icon {
  font-size: 20px;
}

.region-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.region-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.region-tag {
  display: inline-block;
  padding: 3px 10px;
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.08), rgba(218, 165, 32, 0.08));
  border-radius: 12px;
  font-size: 12px;
  color: var(--primary-color);
  border: 1px solid rgba(178, 34, 34, 0.15);
}

/* 帖子列表 */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  padding: 20px 24px;
  background: white;
  cursor: pointer;
}

.post-time {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 8px;
}

.post-text {
  font-size: 15px;
  color: var(--text-dark);
  line-height: 1.7;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-status {
  font-size: 12px;
  color: var(--warning-color);
}

.post-action {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: 500;
}

/* 快捷入口 */
.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.quick-link-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.quick-link-icon {
  font-size: 28px;
}

.quick-link-text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-dark);
}

.quick-link-arrow {
  font-size: 18px;
  color: var(--primary-color);
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    padding: 70px 0 30px;
  }

  .page-header h1 {
    font-size: 28px;
  }

  .profile-card {
    flex-direction: column;
    text-align: center;
    padding: 30px 20px;
    margin-top: -60px;
  }

  .profile-meta {
    justify-content: center;
  }

  .avatar-circle {
    width: 80px;
    height: 80px;
  }

  .avatar-text {
    font-size: 34px;
  }

  .profile-name {
    font-size: 22px;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .level-stars-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .quick-links {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .level-stars-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .achievement-title {
    flex-direction: column;
    text-align: center;
  }

  .regions-grid {
    grid-template-columns: 1fr;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }
}
</style>
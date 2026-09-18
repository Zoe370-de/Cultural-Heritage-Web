<template>
  <div class="community">
    <section class="page-header">
      <div class="container">
        <h1>互动社区</h1>
        <p>分享感悟，一起探索非遗文化</p>
      </div>
    </section>

    <section class="community-content">
      <div class="container">
        <div class="tab-container">
          <div class="tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              class="tab-btn"
              :class="{ 'active': activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-name">{{ tab.name }}</span>
            </button>
          </div>
        </div>

        <!-- 帖子列表 -->
        <div v-if="activeTab === 'posts'" class="tab-content">
          <div class="forum-layout">
            <div class="forum-main">
              <div class="forum-toolbar">
                <h3>帖子列表</h3>
                <div class="toolbar-right">
                  <span class="post-count">共 {{ forumTotal }} 篇帖子</span>
                  <button class="btn btn-primary" @click="showCreateForm = !showCreateForm" v-if="authStore.isLoggedIn">
                    {{ showCreateForm ? '取消' : '+ 发布帖子' }}
                  </button>
                  <button class="btn btn-primary" @click="showLogin = true" v-else>
                    登录后发帖
                  </button>
                </div>
              </div>

              <div v-if="showCreateForm" class="create-form card">
                <textarea
                  v-model="newPostContent"
                  placeholder="分享你对非遗文化的感悟..."
                  class="create-textarea"
                  maxlength="500"
                ></textarea>
                <div class="create-footer">
                  <span class="char-count">{{ newPostContent.length }}/500</span>
                  <button class="btn btn-primary" @click="submitPost" :disabled="!newPostContent.trim()">
                    发布
                  </button>
                </div>
              </div>

              <div v-if="forumLoading" class="loading-state"><SkeletonLoader type="list" /></div>

              <div v-else-if="forumPosts.length === 0" class="empty-state">
                <div class="empty-icon">📝</div>
                <p>还没有帖子，快来发表第一篇吧！</p>
              </div>

              <div v-else class="post-list">
                <div 
                  v-for="post in forumPosts" 
                  :key="post.post_id" 
                  class="post-card card" 
                  :class="{ 'pending-post': post.status === 0 }"
                  @click="goToPost(post.post_id)"
                >
                  <div class="post-header">
                    <span class="post-user">👤 {{ post.username }}</span>
                    <span class="post-time">{{ post.createtime }}</span>
                  </div>
                  <div class="post-content" v-html="formatContent(post.comment)"></div>
                  <div class="post-footer">
                    <span class="post-status" v-if="post.status === 0">⏳ 待审核</span>
                    <span class="post-action">查看详情 →</span>
                  </div>
                </div>
              </div>

              <div v-if="totalPages > 1" class="pagination">
                <button 
                  class="page-btn" 
                  :disabled="currentPage === 1"
                  @click="goToFirstPage"
                >首页</button>
                <button 
                  class="page-btn" 
                  :disabled="currentPage === 1"
                  @click="goToPrevPage"
                >上一页</button>
                <button 
                  v-for="page in pageNumbers" 
                  :key="page"
                  class="page-btn"
                  :class="{ 'active': page === currentPage }"
                  @click="changePage(page)"
                >{{ page }}</button>
                <button 
                  class="page-btn" 
                  :disabled="currentPage === totalPages"
                  @click="goToNextPage"
                >下一页</button>
                <button 
                  class="page-btn" 
                  :disabled="currentPage === totalPages"
                  @click="goToLastPage"
                >末页</button>
              </div>
            </div>

            <div class="forum-sidebar">
              <div class="sidebar-card card">
                <h4>论坛公告</h4>
                <ul>
                  <li>文明发言，尊重他人</li>
                  <li>禁止发布违规内容</li>
                  <li>发帖需通过审核后展示</li>
                  <li>欢迎大家分享文化心得</li>
                </ul>
              </div>

              <div class="sidebar-card card" v-if="authStore.isAdmin">
                <h4>🔧 管理员面板</h4>
                <button class="btn btn-primary" style="width:100%;margin-top:10px;" @click="loadPending">
                  查看待审核内容
                  <span v-if="pendingCount > 0" class="badge-count">{{ pendingCount }}</span>
                </button>
                <div v-if="pendingPosts.length || pendingComments.length" class="pending-list">
                  <h5>待审核帖子 ({{ pendingPosts.length }})</h5>
                  <div v-for="p in pendingPosts" :key="'p'+p.post_id" class="pending-item">
                    <p>{{ p.comment }}</p>
                    <div class="pending-actions">
                      <button class="action-btn edit" @click="doAudit('post', p.post_id, 1, '')">通过</button>
                      <button class="action-btn delete" @click="doAudit('post', p.post_id, 2, '违规内容')">拒绝</button>
                    </div>
                  </div>
                  <h5>待审核评论 ({{ pendingComments.length }})</h5>
                  <div v-for="c in pendingComments" :key="'c'+c.comment_id" class="pending-item">
                    <p>{{ c.comment }}</p>
                    <div class="pending-actions">
                      <button class="action-btn edit" @click="doAudit('comment', c.comment_id, 1, '')">通过</button>
                      <button class="action-btn delete" @click="doAudit('comment', c.comment_id, 2, '违规内容')">拒绝</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="sidebar-card card" v-if="!authStore.isLoggedIn">
                <h4>加入讨论</h4>
                <p>登录后即可发帖评论</p>
                <button class="btn btn-primary" style="width:100%;margin-top:10px;" @click="showLogin = true">
                  登录 / 注册
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的非遗足迹 -->
        <div v-if="activeTab === 'footprint'" class="tab-content">
          <div class="footprint-section">
            <div class="profile-card card">
              <div class="profile-header">
                <div class="profile-avatar">
                  <span class="avatar-icon">{{ appStore.currentArtisanTitle.icon }}</span>
                </div>
                <div class="profile-info">
                  <h2>{{ authStore.isLoggedIn ? authStore.user.username : '非遗爱好者' }}</h2>
                  <div class="profile-title">
                    <span class="title-badge">{{ appStore.currentArtisanTitle.title }}</span>
                  </div>
                  <p>{{ appStore.currentArtisanTitle.description }}</p>
                </div>
              </div>
              
              <div class="profile-stats">
                <div class="stat-item">
                  <span class="stat-num">{{ appStore.visitedRegions.length }}</span>
                  <span class="stat-label">点亮城市</span>
                </div>
                <div class="stat-item">
                  <span class="stat-num">{{ appStore.unlockedLevels }}</span>
                  <span class="stat-label">解锁关卡</span>
                </div>
                <div class="stat-item">
                  <span class="stat-num">{{ appStore.totalStars }}</span>
                  <span class="stat-label">获得星星</span>
                </div>
                <div class="stat-item">
                  <span class="stat-num">{{ appStore.score }}</span>
                  <span class="stat-label">总分数</span>
                </div>
              </div>
            </div>

            <div class="footprint-grid">
              <div class="footprint-card card">
                <h3>🗺️ 我的足迹地图</h3>
                <div class="map-container">
                  <div class="map-grid">
                    <div 
                      v-for="(region, key) in appStore.regionMap" 
                      :key="key"
                      class="region-dot"
                      :class="{ 'visited': appStore.visitedRegions.includes(key) }"
                      :style="{ top: `${region.lng / 55 * 100}%`, left: `${(region.lat - 73) / 60 * 100}%` }"
                      @click="goToMap(key)"
                    >
                      <div class="dot-pulse" v-if="appStore.visitedRegions.includes(key)"></div>
                    </div>
                  </div>
                </div>
                <div class="region-list">
                  <div 
                    v-for="(region, key) in appStore.regionMap" 
                    :key="key"
                    class="region-item"
                    :class="{ 'visited': appStore.visitedRegions.includes(key) }"
                  >
                    <span class="region-check">{{ appStore.visitedRegions.includes(key) ? '✅' : '⬜' }}</span>
                    <span class="region-name">{{ region.name }}</span>
                    <span class="region-items">{{ region.items.join('、') }}</span>
                  </div>
                </div>
              </div>

              <div class="footprint-card card">
                <h3>🏆 闯关进度</h3>
                <div class="progress-list">
                  <div 
                    v-for="level in 6" 
                    :key="level"
                    class="progress-item"
                  >
                    <div class="progress-header">
                      <span class="level-icon">{{ appStore.levelConfig[level].icon }}</span>
                      <span class="level-name">{{ appStore.levelConfig[level].name }}</span>
                      <span class="level-stars">
                        <span v-for="star in 3" :key="star">
                          {{ star <= appStore.levelStars[level] ? '⭐' : '☆' }}
                        </span>
                      </span>
                    </div>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: `${appStore.levelStars[level] > 0 ? 100 : (level <= appStore.unlockedLevels ? 0 : -1)}%` }"
                      ></div>
                    </div>
                    <span class="level-status">
                      {{ level > appStore.unlockedLevels ? '🔒 未解锁' : appStore.levelStars[level] >= 2 ? '✅ 已通关' : '⏳ 挑战中' }}
                    </span>
                  </div>
                </div>
                <button class="btn btn-primary" @click="goToInteractive">继续闯关 →</button>
              </div>
            </div>

            <div class="leaderboard-card card">
              <h3>🏅 非遗守护者排行榜</h3>
              <div class="leaderboard-list">
                <div 
                  v-for="(user, index) in leaderboard" 
                  :key="user.name"
                  class="leaderboard-item"
                  :class="{ 'top-three': index < 3 }"
                >
                  <span class="rank">
                    <span v-if="index === 0">🥇</span>
                    <span v-else-if="index === 1">🥈</span>
                    <span v-else-if="index === 2">🥉</span>
                    <span v-else>{{ index + 1 }}</span>
                  </span>
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-title">{{ user.title }}</span>
                  <span class="user-score">{{ user.score }}分</span>
                  <span class="user-cities">{{ user.cities }}城</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 晒出家乡非遗 -->
        <div v-if="activeTab === 'share'" class="tab-content">
          <div class="share-section">
            <div class="share-header">
              <h2>🌄 晒出家乡非遗</h2>
              <p>分享你家乡的非遗文化，让更多人了解它的魅力</p>
            </div>

            <div class="share-form card" v-if="authStore.isLoggedIn">
              <div class="form-group">
                <label>非遗名称</label>
                <input 
                  v-model="shareForm.name" 
                  type="text" 
                  placeholder="如：苏绣、景德镇陶瓷、剪纸..."
                />
              </div>
              <div class="form-group">
                <label>所属地区</label>
                <input 
                  v-model="shareForm.region" 
                  type="text" 
                  placeholder="如：江苏苏州、江西景德镇..."
                />
              </div>
              <div class="form-group">
                <label>非遗故事</label>
                <textarea 
                  v-model="shareForm.content" 
                  placeholder="分享你知道的非遗故事、制作工艺或个人感悟..."
                  maxlength="1000"
                ></textarea>
                <span class="char-count">{{ shareForm.content.length }}/1000</span>
              </div>
              <div class="form-group">
                <label>上传照片（选填）</label>
                <div class="upload-area" @click="triggerUpload" v-if="!uploadPreview">
                  <span class="upload-icon">📷</span>
                  <span>点击上传照片</span>
                </div>
                <div v-else class="upload-preview">
                  <img :src="uploadPreview" alt="预览" />
                  <button class="upload-remove" @click="removeUpload">✕ 移除</button>
                </div>
                <input 
                  type="file" 
                  class="upload-input" 
                  ref="uploadInputRef"
                  accept="image/*"
                  @change="handleUpload" 
                />
                <span v-if="uploading" class="upload-status">
                  <span class="upload-progress-bar">
                    <span class="upload-progress-fill" :style="{ width: uploadProgress + '%' }"></span>
                  </span>
                  {{ uploadProgressText }}
                </span>
              </div>
              <button 
                class="btn btn-primary" 
                @click="submitShare" 
                :disabled="!shareForm.name || !shareForm.content"
              >
                发布分享
              </button>
            </div>

            <div v-else class="login-prompt card">
              <div class="prompt-icon">🔒</div>
              <p>登录后即可分享家乡非遗</p>
              <button class="btn btn-primary" @click="showLogin = true">登录 / 注册</button>
            </div>

            <div class="share-list">
              <h3>精彩分享</h3>
              <div v-if="forumLoading" class="loading-state"><SkeletonLoader type="list" /></div>
              <div v-else-if="sharePosts.length === 0" class="empty-state">
                <div class="empty-icon">🌄</div>
                <p>还没有分享，快来分享你家乡的非遗吧！</p>
              </div>
              <div v-else class="share-grid">
                <div 
                  v-for="share in sharePosts" 
                  :key="share.post_id"
                  class="share-card card"
                  @click="goToPost(share.post_id)"
                >
                  <div class="share-header">
                    <span class="share-user">👤 {{ share.username }}</span>
                    <span class="share-time">{{ formatPostTime(share.createtime) }}</span>
                  </div>
                  <div class="share-name">{{ extractShareName(share.comment) }}</div>
                  <div class="share-region">📍 {{ extractShareRegion(share.comment) }}</div>
                  <div class="share-content" v-html="formatContent(extractShareContent(share.comment))"></div>
                  <div class="share-actions">
                    <span class="share-hint">💬 点击查看评论 →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 求助墙 -->
        <div v-if="activeTab === 'help'" class="tab-content">
          <div class="help-section">
            <div class="help-header">
              <h2>🙋 求助墙</h2>
              <p>遇到难题？快来这里求助，社区小伙伴会帮助你！</p>
            </div>

            <div class="help-form card" v-if="authStore.isLoggedIn">
              <div class="form-group">
                <label>问题标题</label>
                <input 
                  v-model="helpForm.title" 
                  type="text" 
                  placeholder="简要描述你的问题..."
                />
              </div>
              <div class="form-group">
                <label>问题详情</label>
                <textarea 
                  v-model="helpForm.content" 
                  placeholder="详细描述你遇到的问题，方便大家解答..."
                  maxlength="1000"
                ></textarea>
                <span class="char-count">{{ helpForm.content.length }}/1000</span>
              </div>
              <button 
                class="btn btn-primary" 
                @click="submitHelp" 
                :disabled="!helpForm.title || !helpForm.content"
              >
                发布求助
              </button>
            </div>

            <div v-else class="login-prompt card">
              <div class="prompt-icon">🔒</div>
              <p>登录后即可发布求助</p>
              <button class="btn btn-primary" @click="showLogin = true">登录 / 注册</button>
            </div>

            <div class="help-list">
              <h3>求助列表</h3>
              <div v-if="forumLoading" class="loading-state"><SkeletonLoader type="list" /></div>
              <div v-else-if="helpPosts.length === 0" class="empty-state">
                <div class="empty-icon">🙋</div>
                <p>还没有求助，快来提问吧！</p>
              </div>
              <div v-else class="help-grid">
                <div 
                  v-for="help in helpPosts" 
                  :key="help.post_id"
                  class="help-card card"
                  @click="goToPost(help.post_id)"
                >
                  <div class="help-header">
                    <span class="help-user">👤 {{ help.username }}</span>
                    <span class="help-status unanswered">
                      ❓ 待解答
                    </span>
                  </div>
                  <div class="help-title">{{ extractHelpTitle(help.comment) }}</div>
                  <div class="help-content" v-html="formatContent(extractHelpContent(help.comment))"></div>
                  <div class="help-actions">
                    <span class="help-hint">💬 点击去回答 →</span>
                    <span class="help-time">{{ formatPostTime(help.createtime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <LoginModal :show="showLogin" @close="showLogin = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useForumStore } from '../stores/forum.js'
import { useAppStore } from '../stores/app'
import LoginModal from '../components/LoginModal.vue'
import { uploadImage } from '../api/upload.js'
import SkeletonLoader from '../components/SkeletonLoader.vue'

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

const router = useRouter()
const authStore = useAuthStore()
const forumStore = useForumStore()
const appStore = useAppStore()

const activeTab = ref('posts')
const tabs = [
  { id: 'posts', name: '帖子列表', icon: '📝' },
  { id: 'footprint', name: '我的足迹', icon: '👣' },
  { id: 'share', name: '晒家乡非遗', icon: '🌄' },
  { id: 'help', name: '求助墙', icon: '🙋' }
]

const forumLoading = ref(true)
const showCreateForm = ref(false)
const showLogin = ref(false)
const newPostContent = ref('')
const pendingPosts = ref([])
const pendingComments = ref([])
const pendingCount = computed(() => pendingPosts.value.length + pendingComments.value.length)

const currentPage = ref(1)
const pageSize = ref(10)

const forumPosts = computed(() => {
  return [...forumStore.posts].sort((a, b) => {
    const dateA = new Date(a.createtime)
    const dateB = new Date(b.createtime)
    return dateB - dateA
  })
})
const forumTotal = computed(() => forumStore.totalPosts)

const formatPostTime = (timeStr) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  return d.toLocaleString('zh-CN')
}

const formatContent = (content) => {
  if (!content) return ''
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  html = html.replace(/\[图片\]([^\s]+)/g, '<img src="$1" alt="分享图片" class="post-image" />')
  html = html.replace(/\n/g, '<br>')
  return html
}

const sharePosts = computed(() => {
  return forumPosts.value.filter(p => p.comment.includes('【晒家乡非遗】'))
})

const extractShareName = (comment) => {
  const match = comment.match(/【晒家乡非遗】(.+?)\n/)
  return match ? match[1] : '非遗分享'
}

const extractShareRegion = (comment) => {
  const match = comment.match(/📍 (.+?)\n/)
  return match ? match[1] : '未知地区'
}

const extractShareContent = (comment) => {
  const lines = comment.split('\n')
  const contentIdx = lines.findIndex(l => l.trim() === '')
  if (contentIdx !== -1 && contentIdx < lines.length - 1) {
    return lines.slice(contentIdx + 1).join('\n').substring(0, 100)
  }
  return comment.substring(0, 100)
}

const helpPosts = computed(() => {
  return forumPosts.value.filter(p => p.comment.includes('【求助】'))
})

const extractHelpTitle = (comment) => {
  const match = comment.match(/【求助】(.+?)\n/)
  return match ? match[1] : '求助问题'
}

const extractHelpContent = (comment) => {
  const lines = comment.split('\n')
  const contentIdx = lines.findIndex(l => l.trim() === '')
  if (contentIdx !== -1 && contentIdx < lines.length - 1) {
    return lines.slice(contentIdx + 1).join('\n').substring(0, 100)
  }
  return comment.substring(0, 100)
}

const totalPages = computed(() => {
  return Math.ceil(forumTotal.value / pageSize.value) || 1
})

const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const leaderboard = ref([
  { name: '非遗爱好者A', title: '非遗传承人', score: 2850, cities: 22 },
  { name: '文化探索者', title: '熟练工匠', score: 2340, cities: 18 },
  { name: '匠心学徒', title: '熟练工匠', score: 1980, cities: 15 },
  { name: '传统文化迷', title: '初级学徒', score: 1560, cities: 12 },
  { name: '国风少年', title: '初级学徒', score: 1230, cities: 10 }
])

const shareForm = ref({
  name: '',
  region: '',
  content: ''
})

const uploadInputRef = ref(null)
const uploadPreview = ref('')
const uploading = ref(false)
const uploadedImageUrl = ref('')
const uploadProgress = ref(0)
const uploadProgressText = ref('')

const helpForm = ref({
  title: '',
  content: ''
})

const loadPosts = async (page = 1) => {
  forumLoading.value = true
  try {
    await forumStore.loadPosts(page, pageSize.value)
    currentPage.value = page
  } catch (error) {
    console.error('加载帖子失败，使用Mock数据:', error)
    forumStore.posts = [
      { post_id: 1, comment: '今天参观了苏州刺绣博物馆，被苏绣的精美技艺深深震撼！一根丝线可以劈成1/128根使用，这种精湛的手艺真的让人叹为观止。', username: '非遗爱好者A', createtime: '2026-07-08 14:30:00', status: 1 },
      { post_id: 2, comment: '景德镇的青花瓷真的太美了！千年窑火不断，每一件瓷器都承载着匠人的心血。', username: '文化探索者', createtime: '2026-07-07 10:15:00', status: 1 },
      { post_id: 3, comment: '剪纸艺术真的很神奇，一把剪刀就能剪出万千世界。分享一下我的作品，请大家多多指教！', username: '匠心学徒', createtime: '2026-07-06 16:45:00', status: 1 },
      { post_id: 4, comment: '京剧脸谱的色彩太丰富了，每种颜色都有特定的含义。最近在学习画脸谱，感觉很有趣！', username: '戏曲迷', createtime: '2026-07-05 11:00:00', status: 1 },
      { post_id: 5, comment: '四川的蜀绣也很有名，针法独特，色彩鲜艳。有机会一定要去成都看看！', username: '锦绣工艺爱好者', createtime: '2026-07-04 15:30:00', status: 1 }
    ]
    forumStore.totalPosts = 5
    currentPage.value = page
  } finally {
    forumLoading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    loadPosts(page)
  }
}

const goToFirstPage = () => changePage(1)
const goToPrevPage = () => changePage(currentPage.value - 1)
const goToNextPage = () => changePage(currentPage.value + 1)
const goToLastPage = () => changePage(totalPages.value)

const submitPost = async () => {
  const content = newPostContent.value.trim()
  if (!content) return
  if (!authStore.isLoggedIn) {
    showLogin.value = true
    return
  }
  
  try {
    await forumStore.createPost(content)
    newPostContent.value = ''
    showCreateForm.value = false
    showMessage(authStore.isAdmin ? '发布成功！' : '发布成功，等待管理员审核后展示。', 'success')
    await forumStore.loadPosts(1)
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '未知错误'
    showMessage('发布失败：' + errorMsg, 'error')
  }
}

const goToPost = (id) => {
  router.push(`/forum/${id}`)
}

const loadPending = async () => {
  try {
    const data = await forumStore.loadPending()
    pendingPosts.value = data.pendingPosts || []
    pendingComments.value = data.pendingComments || []
  } catch (error) {
    console.error('加载待审核内容失败，使用Mock数据:', error)
    pendingPosts.value = [
      { post_id: 101, comment: '分享一下我家乡的非遗文化——剪纸艺术', username: '剪纸爱好者', createtime: '2026-07-09 09:00:00', status: 0 },
      { post_id: 102, comment: '景德镇陶瓷制作过程真的很神奇！', username: '陶艺初学者', createtime: '2026-07-09 08:30:00', status: 0 }
    ]
    pendingComments.value = [
      { comment_id: 201, comment: '苏绣确实很美！', username: '路人甲', createtime: '2026-07-09 09:15:00', status: 0 },
      { comment_id: 202, comment: '支持非遗传承！', username: '文化爱好者', createtime: '2026-07-09 09:20:00', status: 0 }
    ]
  }
}

const doAudit = async (type, id, status, reason) => {
  try {
    await forumStore.audit(type, id, status, reason)
    
    if (type === 'post') {
      pendingPosts.value = pendingPosts.value.filter(p => p.post_id !== id)
    } else {
      pendingComments.value = pendingComments.value.filter(c => c.comment_id !== id)
    }
    
    if (status === 2 && reason) {
      showMessage('已拒绝：' + reason, 'warning')
    } else if (status === 1) {
      showMessage('审核通过！', 'success')
    }
    
    await forumStore.loadPosts(1)
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '未知错误'
    showMessage('审核失败：' + errorMsg, 'error')
  }
}

const goToMap = (region) => {
  sessionStorage.setItem('selectedRegion', region)
  router.push('/culture')
}

const goToInteractive = () => {
  router.push('/interactive')
}

const submitShare = async () => {
  if (!shareForm.value.name || !shareForm.value.content) return
  if (!authStore.isLoggedIn) {
    showLogin.value = true
    return
  }
  
  let content = `【晒家乡非遗】${shareForm.value.name}\n📍 ${shareForm.value.region || '未知地区'}\n\n${shareForm.value.content}`
  
  if (uploadedImageUrl.value) {
    content += `\n\n[图片]${uploadedImageUrl.value}`
  }
  
  try {
    await forumStore.createPost(content)
    shareForm.value = { name: '', region: '', content: '' }
    uploadPreview.value = ''
    uploadedImageUrl.value = ''
    showMessage('分享发布成功，等待审核后展示！', 'success')
    await loadPosts(1)
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '未知错误'
    showMessage('发布失败：' + errorMsg, 'error')
  }
}

const triggerUpload = () => {
  uploadInputRef.value?.click()
}

const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const handleUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showMessage('请选择图片文件', 'warning')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    showMessage('图片大小不能超过10MB', 'warning')
    return
  }

  // 先显示本地预览
  const reader = new FileReader()
  reader.onload = (ev) => {
    uploadPreview.value = ev.target.result
  }
  reader.readAsDataURL(file)

  // 上传到服务器
  uploading.value = true
  uploadProgress.value = 0
  uploadProgressText.value = '压缩中...'
  
  try {
    // 前端压缩图片
    uploadProgress.value = 20
    uploadProgressText.value = '压缩图片...'
    const compressed = await compressImage(file, 1200, 0.75)
    
    uploadProgress.value = 50
    uploadProgressText.value = '上传中...'
    
    const { data } = await uploadImage(compressed, file.name)
    
    uploadProgress.value = 100
    uploadProgressText.value = '上传完成！'
    uploadedImageUrl.value = data.url
    
    setTimeout(() => {
      showMessage('照片上传成功！', 'success')
    }, 300)
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message || '上传失败'
    showMessage('照片上传失败：' + errorMsg, 'error')
    uploadPreview.value = ''
    uploadedImageUrl.value = ''
  } finally {
    uploading.value = false
  }
}

const removeUpload = () => {
  uploadPreview.value = ''
  uploadedImageUrl.value = ''
  if (uploadInputRef.value) {
    uploadInputRef.value.value = ''
  }
}

const submitHelp = async () => {
  if (!helpForm.value.title || !helpForm.value.content) return
  if (!authStore.isLoggedIn) {
    showLogin.value = true
    return
  }
  
  const content = `【求助】${helpForm.value.title}\n\n${helpForm.value.content}`
  
  try {
    await forumStore.createPost(content)
    helpForm.value = { title: '', content: '' }
    showMessage('求助发布成功，等待审核后展示！', 'success')
    await loadPosts(1)
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '未知错误'
    showMessage('发布失败：' + errorMsg, 'error')
  }
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 100px 0 60px;
  text-align: center;
}

.page-header h1 {
  font-size: 40px;
  margin-bottom: 15px;
}

.page-header p {
  font-size: 18px;
  opacity: 0.9;
}

.community-content {
  padding: 40px 0 80px;
  background: var(--bg-light);
}

.tab-container {
  margin-bottom: 30px;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.tabs {
  display: flex;
  gap: 10px;
  background: white;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-light);
}

.tab-btn:hover {
  background: rgba(178, 34, 34, 0.1);
  color: var(--primary-color);
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(178, 34, 34, 0.3);
}

.tab-icon {
  font-size: 18px;
}

.forum-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 30px;
}

.forum-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.forum-toolbar h3 {
  font-size: 20px;
  color: var(--text-dark);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-count {
  font-size: 14px;
  color: var(--text-light);
}

.create-form {
  padding: 20px;
  margin-bottom: 20px;
}

.create-textarea {
  width: 100%;
  min-height: 100px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.create-textarea:focus {
  border-color: var(--primary-color);
}

.create-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.char-count {
  font-size: 13px;
  color: var(--text-light);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.post-card {
  padding: 25px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 15px 50px 15px 50px;
  position: relative;
  overflow: hidden;
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(178, 34, 34, 0.05) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.post-card:hover {
  border-radius: 50px 15px 50px 15px;
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 15px 40px rgba(178, 34, 34, 0.15);
}

.post-card:hover::before {
  opacity: 1;
}

.post-card.pending-post {
  opacity: 0.7;
  background: linear-gradient(135deg, #fff 0%, #fff9e6 100%);
  border-left: 3px solid #F39C12;
}

.post-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.post-user {
  font-weight: 600;
  color: var(--text-dark);
  font-size: 14px;
}

.post-time {
  font-size: 13px;
  color: var(--text-light);
}

.post-content {
  font-size: 15px;
  color: var(--text-dark);
  line-height: 1.6;
  margin-bottom: 12px;
  overflow: hidden;
}

.post-image {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: block;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-status {
  font-size: 12px;
  color: #F39C12;
  background: rgba(243, 156, 18, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.post-action {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: 500;
}

.sidebar-card {
  padding: 20px;
  margin-bottom: 20px;
}

.sidebar-card h4 {
  font-size: 16px;
  margin-bottom: 15px;
  color: var(--text-dark);
}

.sidebar-card ul {
  list-style: none;
}

.sidebar-card ul li {
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-light);
  border-bottom: 1px dashed var(--border-color);
}

.sidebar-card p {
  font-size: 14px;
  color: var(--text-light);
}

.pending-list {
  margin-top: 15px;
}

.pending-list h5 {
  font-size: 14px;
  color: var(--text-dark);
  margin: 10px 0 5px;
}

.pending-item {
  background: var(--bg-light);
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.pending-item p {
  font-size: 13px;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.pending-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn.edit {
  background: rgba(39, 174, 96, 0.1);
  color: #27AE60;
}

.action-btn.delete {
  background: rgba(231, 76, 60, 0.1);
  color: #E74C3C;
}

.badge-count {
  display: inline-block;
  background: #E74C3C;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.empty-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-state p {
  color: var(--text-light);
}

.loading-text {
  text-align: center;
  padding: 40px;
  color: var(--text-light);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 30px;
  padding: 20px 0;
}

.page-btn {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-dark);
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: rgba(178, 34, 34, 0.05);
  color: var(--primary-color);
}

.page-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.btn {
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(178, 34, 34, 0.3);
}

.btn-secondary {
  background: var(--text-dark);
  color: white;
}

.btn-secondary:hover {
  background: #34495E;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footprint-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.profile-card {
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 25px;
  margin-bottom: 30px;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #B22222, #8B4513);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #DAA520;
}

.avatar-icon {
  font-size: 48px;
}

.profile-info h2 {
  font-size: 24px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.title-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.2), rgba(178, 34, 34, 0.1));
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 20px;
  font-size: 14px;
  color: #8B4513;
  font-weight: 500;
}

.profile-info p {
  font-size: 14px;
  color: var(--text-light);
  margin-top: 8px;
}

.profile-stats {
  display: flex;
  gap: 50px;
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: #B22222;
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
}

.footprint-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.footprint-card {
  padding: 25px;
}

.footprint-card h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 20px;
}

.map-container {
  height: 200px;
  background: linear-gradient(135deg, #F5F0E6, #EDE5D8);
  border-radius: 8px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.map-grid {
  position: relative;
  width: 100%;
  height: 100%;
}

.region-dot {
  position: absolute;
  width: 16px;
  height: 16px;
  background: rgba(178, 34, 34, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: all 0.3s ease;
}

.region-dot.visited {
  background: #B22222;
}

.region-dot:hover {
  transform: translate(-50%, -50%) scale(1.5);
}

.dot-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: rgba(178, 34, 34, 0.3);
  border-radius: 50%;
  animation: dotPulse 2s infinite;
}

@keyframes dotPulse {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

.region-list {
  max-height: 200px;
  overflow-y: auto;
}

.region-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border-color);
  font-size: 14px;
}

.region-item.visited {
  opacity: 1;
}

.region-item:not(.visited) {
  opacity: 0.5;
}

.region-check {
  font-size: 16px;
}

.region-name {
  flex: 1;
  color: var(--text-dark);
}

.region-items {
  color: var(--text-light);
  font-size: 12px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.progress-item {
  padding: 15px;
  background: var(--bg-light);
  border-radius: 8px;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.level-icon {
  font-size: 20px;
}

.level-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-dark);
}

.level-stars {
  font-size: 16px;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #B22222, #DAA520);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.level-status {
  font-size: 12px;
  color: var(--text-light);
}

.footprint-card .btn {
  width: 100%;
  margin-top: 20px;
}

.leaderboard-card {
  padding: 25px;
}

.leaderboard-card h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 20px;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  background: var(--bg-light);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.leaderboard-item:hover {
  background: rgba(178, 34, 34, 0.05);
}

.leaderboard-item.top-three {
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.1), rgba(178, 34, 34, 0.05));
  border: 1px solid rgba(218, 165, 32, 0.2);
}

.rank {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-light);
  width: 30px;
}

.user-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-dark);
}

.user-title {
  font-size: 12px;
  color: #8B4513;
  background: rgba(218, 165, 32, 0.1);
  padding: 4px 10px;
  border-radius: 10px;
}

.user-score {
  font-weight: 600;
  color: #B22222;
}

.user-cities {
  font-size: 12px;
  color: var(--text-light);
}

.share-section,
.help-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.share-header,
.help-header {
  text-align: center;
}

.share-header h2,
.help-header h2 {
  font-size: 28px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.share-header p,
.help-header p {
  font-size: 16px;
  color: var(--text-light);
}

.share-form,
.help-form {
  padding: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--primary-color);
}

.form-group textarea {
  min-height: 120px;
  resize: vertical;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(178, 34, 34, 0.05);
}

.upload-icon {
  font-size: 32px;
}

.upload-input {
  display: none;
}

.upload-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--primary-color);
}

.upload-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

.upload-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-remove:hover {
  background: rgba(192, 57, 43, 1);
}

.upload-status {
  display: block;
  text-align: center;
  color: var(--primary-color);
  font-size: 13px;
  margin-top: 8px;
}

.upload-progress-bar {
  display: block;
  width: 100%;
  height: 4px;
  background: #e8e0d5;
  border-radius: 2px;
  margin-bottom: 6px;
  overflow: hidden;
}

.upload-progress-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--secondary-color), var(--primary-color));
  border-radius: 2px;
  transition: width 0.4s ease;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.login-prompt {
  padding: 40px;
  text-align: center;
}

.prompt-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.login-prompt p {
  font-size: 16px;
  color: var(--text-light);
  margin-bottom: 20px;
}

.share-list h3,
.help-list h3 {
  font-size: 20px;
  color: var(--text-dark);
  margin-bottom: 20px;
}

.share-grid,
.help-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.share-card,
.help-card {
  padding: 20px;
}

.share-header,
.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.share-user,
.help-user {
  font-size: 13px;
  color: var(--text-light);
}

.share-time,
.help-time {
  font-size: 12px;
  color: var(--text-light);
}

.help-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
}

.help-status.answered {
  background: rgba(39, 174, 96, 0.1);
  color: #27AE60;
}

.help-status.unanswered {
  background: rgba(243, 156, 18, 0.1);
  color: #F39C12;
}

.share-name {
  font-size: 18px;
  font-weight: 600;
  color: #B22222;
  margin-bottom: 5px;
}

.share-region {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 10px;
}

.share-content,
.help-content {
  font-size: 14px;
  color: var(--text-dark);
  line-height: 1.6;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.help-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.share-actions {
  display: flex;
  gap: 20px;
}

.like-btn,
.comment-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-light);
  transition: color 0.3s ease;
}

.like-btn:hover,
.comment-btn:hover {
  color: var(--primary-color);
}

.like-btn.liked {
  color: #E74C3C;
}

.help-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.help-comments {
  font-size: 13px;
  color: var(--text-light);
}

.help-card .btn {
  width: 100%;
}

@media (max-width: 768px) {
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1 1 calc(50% - 5px);
  }
  
  .forum-layout {
    grid-template-columns: 1fr;
  }
  
  .footprint-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-stats {
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .share-grid,
  .help-grid {
    grid-template-columns: 1fr;
  }
  
  .leaderboard-item {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 24px;
  }

  .tab-btn {
    flex: 1 1 100%;
    font-size: 13px;
  }

  .post-card {
    padding: 15px;
  }

  .form-group input,
  .form-group textarea {
    font-size: 14px;
  }

  .btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>
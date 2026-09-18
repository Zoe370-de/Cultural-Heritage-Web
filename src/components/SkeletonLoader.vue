<template>
  <div class="skeleton-wrapper" :class="type">
    <!-- 卡片骨架 -->
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-box skeleton-image"></div>
      <div class="skeleton-box skeleton-title"></div>
      <div class="skeleton-box skeleton-text"></div>
      <div class="skeleton-box skeleton-text short"></div>
    </div>

    <!-- 列表骨架 -->
    <div v-if="type === 'list'" class="skeleton-list">
      <div v-for="i in 3" :key="i" class="skeleton-list-item">
        <div class="skeleton-box skeleton-avatar"></div>
        <div class="skeleton-list-content">
          <div class="skeleton-box skeleton-title"></div>
          <div class="skeleton-box skeleton-text"></div>
        </div>
      </div>
    </div>

    <!-- 详情骨架 -->
    <div v-if="type === 'detail'" class="skeleton-detail">
      <div class="skeleton-box skeleton-hero"></div>
      <div class="skeleton-box skeleton-title"></div>
      <div class="skeleton-box skeleton-text"></div>
      <div class="skeleton-box skeleton-text"></div>
      <div class="skeleton-box skeleton-text short"></div>
    </div>

    <!-- 网格骨架 -->
    <div v-if="type === 'grid'" class="skeleton-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-box skeleton-image"></div>
        <div class="skeleton-box skeleton-title"></div>
        <div class="skeleton-box skeleton-text"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'card',
    validator: (val) => ['card', 'list', 'detail', 'grid'].includes(val)
  }
})
</script>

<style scoped>
.skeleton-wrapper {
  width: 100%;
}

.skeleton-box {
  background: linear-gradient(90deg, #f0e8d8 25%, #e8dcc8 50%, #f0e8d8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-image {
  width: 100%;
  height: 180px;
  border-radius: 12px 12px 0 0;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-title {
  height: 20px;
  width: 70%;
  margin: 12px 0 8px;
}

.skeleton-text {
  height: 14px;
  width: 100%;
  margin-bottom: 6px;
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-hero {
  width: 100%;
  height: 300px;
  border-radius: 12px;
  margin-bottom: 20px;
}

/* 卡片骨架 */
.skeleton-card {
  padding: 0 0 20px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.skeleton-card .skeleton-title,
.skeleton-card .skeleton-text {
  margin-left: 16px;
  margin-right: 16px;
}

/* 列表骨架 */
.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.skeleton-list-content {
  flex: 1;
}

.skeleton-list-content .skeleton-title {
  margin: 0 0 8px;
}

.skeleton-list-content .skeleton-text {
  margin: 0;
}

/* 详情骨架 */
.skeleton-detail {
  padding: 20px;
  background: #fff;
  border-radius: 16px;
}

/* 网格骨架 */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}

@media (max-width: 768px) {
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .skeleton-hero {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
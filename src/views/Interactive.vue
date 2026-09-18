<template>
  <div class="interactive">
    <section v-if="appStore.gameMode === 'normal'" class="level-select-section">
      <div class="container">
        <div class="section-title">
          <h2>🎮 非遗闯关挑战</h2>
          <p>完成6关挑战，解锁匠人称号，成为非遗传承者</p>
        </div>
        
        <div class="artisan-title-card">
          <div class="title-icon">{{ appStore.currentArtisanTitle.icon }}</div>
          <div class="title-info">
            <h3>{{ appStore.currentArtisanTitle.title }}</h3>
            <p>{{ appStore.currentArtisanTitle.description }}</p>
          </div>
          <div class="title-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${((appStore.unlockedLevels - 1) / 5) * 100}%` }"></div>
            </div>
            <span>{{ appStore.unlockedLevels }}/6 关卡解锁</span>
          </div>
        </div>
        
        <div class="level-grid">
          <div 
            v-for="level in 6" 
            :key="level"
            class="level-card"
            :class="{ 
              'locked': level > appStore.unlockedLevels,
              'completed': appStore.levelStars[level] > 0,
              'boss': level === 6
            }"
            @click="selectLevel(level)"
          >
            <div class="level-icon">
              <span v-if="level <= appStore.unlockedLevels">{{ appStore.levelConfig[level].icon }}</span>
              <span v-else>🔒</span>
            </div>
            <div class="level-info">
              <h3>{{ appStore.levelConfig[level].name }}</h3>
              <p>{{ appStore.levelConfig[level].description }}</p>
              <span class="level-type">{{ getTypeLabel(appStore.levelConfig[level].type) }}</span>
            </div>
            <div class="level-stars">
              <span v-for="star in 3" :key="star" class="star">
                {{ star <= appStore.levelStars[level] ? '⭐' : '☆' }}
              </span>
            </div>
            <div v-if="level <= appStore.unlockedLevels" class="level-action">
              <span>{{ appStore.levelStars[level] > 0 ? '重新挑战' : '开始挑战' }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="appStore.wrongQuestions.length > 0" class="review-section">
          <div class="review-card" @click="goToNotebook">
            <div class="review-icon">📜</div>
            <div class="review-info">
              <h3>我的研学手记</h3>
              <p>共有 {{ appStore.wrongQuestions.length }} 道错题需要复习</p>
            </div>
            <button class="btn btn-secondary">查看手记</button>
          </div>
        </div>
        
        <div class="stats-summary">
          <div class="stat-item">
            <span class="stat-num">{{ appStore.totalStars }}</span>
            <span class="stat-label">总星星</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ appStore.score }}</span>
            <span class="stat-label">总分数</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ appStore.maxCombo }}</span>
            <span class="stat-label">最高连击</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ appStore.visitedRegions.length }}</span>
            <span class="stat-label">点亮城市</span>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="quiz-section">
      <div class="container">
        <div class="quiz-header">
          <div class="header-left">
            <button class="back-btn" @click="backToLevelSelect">← 返回关卡</button>
            <div class="level-badge" :style="{ background: appStore.levelConfig[appStore.currentLevel]?.color }">
              {{ appStore.levelConfig[appStore.currentLevel]?.icon }} {{ appStore.levelConfig[appStore.currentLevel]?.name }}
            </div>
          </div>
          <div class="header-right">
            <div class="score-badge">🏆 {{ appStore.score }}</div>
            <div class="title-badge">{{ appStore.currentArtisanTitle.icon }} {{ appStore.currentArtisanTitle.title }}</div>
          </div>
        </div>

        <div class="quiz-progress">
          <div class="progress-info">
            <span>第 {{ appStore.currentLevelIndex + 1 }} / {{ appStore.currentLevelQuestions.length }} 题</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${((appStore.currentLevelIndex + 1) / appStore.currentLevelQuestions.length) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="timer-section">
          <div class="timer-bar-container">
            <div 
              class="timer-bar"
              :class="{ 'warning': appStore.remainingTime <= 10, 'danger': appStore.remainingTime <= 5 }"
              :style="{ width: `${(appStore.remainingTime / appStore.timeLimit) * 100}%` }"
            ></div>
          </div>
          <div class="timer-display" :class="{ 'warning': appStore.remainingTime <= 10, 'danger': appStore.remainingTime <= 5 }">
            <span class="timer-icon">⏱️</span>
            <span class="timer-text">{{ appStore.remainingTime }}s</span>
          </div>
        </div>

        <transition name="combo">
          <div v-if="showComboEffect" class="combo-effect">
            <span class="combo-text">🔥 x{{ comboDisplay }}</span>
          </div>
        </transition>

        <div class="quiz-container" v-if="currentQuestion">
          <div class="quiz-question">
            <h3>{{ currentQuestion.question }}</h3>
            <span class="question-type">{{ getTypeLabel(currentQuestion.type) }}</span>
          </div>
          
          <div v-if="currentQuestion.type === 'judge'" class="quiz-options judge-options">
            <button 
              v-for="(option, index) in currentQuestion.options" 
              :key="index"
              class="option-btn"
              :class="{ 
                'selected': selectedAnswer === index,
                'correct': showResult && index === currentQuestion.answer,
                'wrong': showResult && selectedAnswer === index && index !== currentQuestion.answer,
                'time-up': timeUp
              }"
              :disabled="showResult || timeUp"
              @click="selectAnswer(index)"
            >
              <span class="option-icon">{{ index === 0 ? '✅' : '❌' }}</span>
              <span class="option-text">{{ option }}</span>
            </button>
          </div>
          
          <div v-else-if="currentQuestion.type === 'choice' || currentQuestion.type === 'comprehensive'" class="quiz-options">
            <button 
              v-for="(option, index) in currentQuestion.options" 
              :key="index"
              class="option-btn"
              :class="{ 
                'selected': selectedAnswer === index,
                'correct': showResult && index === currentQuestion.answer,
                'wrong': showResult && selectedAnswer === index && index !== currentQuestion.answer,
                'time-up': timeUp
              }"
              :disabled="showResult || timeUp"
              @click="selectAnswer(index)"
            >
              <span class="option-letter">{{ ['A', 'B', 'C', 'D'][index] }}</span>
              <span class="option-text">{{ option }}</span>
            </button>
          </div>
          
          <div v-else-if="currentQuestion.type === 'fill'" class="quiz-options fill-options">
            <button 
              v-for="(option, index) in currentQuestion.options" 
              :key="index"
              class="option-btn fill-btn"
              :class="{ 
                'selected': selectedAnswer === index,
                'correct': showResult && index === currentQuestion.answer,
                'wrong': showResult && selectedAnswer === index && index !== currentQuestion.answer,
                'time-up': timeUp
              }"
              :disabled="showResult || timeUp"
              @click="selectAnswer(index)"
            >
              <span class="option-text">{{ option }}</span>
            </button>
          </div>
          
          <div v-else-if="currentQuestion.type === 'sort'" class="quiz-options sort-options">
            <div class="sort-container">
              <div 
                v-for="(option, index) in sortedOptions" 
                :key="index"
                class="sort-item"
                :class="{ 
                  'dragging': dragIndex === index,
                  'correct': showResult && checkSortCorrect()
                }"
                draggable="true"
                @dragstart="startDrag(index)"
                @dragover.prevent
                @drop="dropItem(index)"
              >
                <span class="sort-number">{{ index + 1 }}</span>
                <span class="sort-text">{{ option }}</span>
              </div>
            </div>
          </div>
          
          <div class="quiz-actions">
            <button 
              v-if="!showResult && !timeUp" 
              class="btn btn-primary" 
              :disabled="!canSubmit"
              @click="submitAnswer"
            >
              提交答案
            </button>
            <button 
              v-if="showResult || timeUp" 
              class="btn btn-primary" 
              @click="nextQuestion"
            >
              {{ isLastQuestion ? '查看结果' : '下一题' }}
            </button>
          </div>
          
          <transition name="result">
            <div v-if="showResult || timeUp" class="result-message" :class="resultClass">
              <div class="result-icon">{{ resultIcon }}</div>
              <div class="result-content">
                <h4>{{ resultTitle }}</h4>
                <p>{{ resultMessage }}</p>
                <div v-if="showResult && !isCorrect && !timeUp" class="correct-answer">
                  <span v-if="currentQuestion.type !== 'sort'">正确答案：{{ ['A', 'B', 'C', 'D'][currentQuestion.answer] }} - {{ currentQuestion.options[currentQuestion.answer] }}</span>
                  <span v-else>正确顺序：{{ currentQuestion.options.map((opt, idx) => `${idx + 1}.${opt}`).join(' → ') }}</span>
                </div>
                <transition name="fade">
                  <div v-if="showResult && !isCorrect && !timeUp && currentQuestion.explanation" class="culture-card">
                    <h5>📚 非遗小知识</h5>
                    <p>{{ currentQuestion.explanation }}</p>
                  </div>
                </transition>
              </div>
            </div>
          </transition>
        </div>

        <transition name="danmaku">
          <div v-if="showLevelComplete" class="danmaku-overlay" @click.self="dismissDanmaku">
            <div class="danmaku-card">
              <button class="danmaku-close" @click="dismissDanmaku">✕</button>
              <div class="complete-icon">{{ levelResult.stars >= 2 ? '🎉' : levelResult.stars >= 1 ? '💪' : '😢' }}</div>
              <h2>关卡完成！</h2>
              <div v-if="levelResult.newTitle" class="title-upgrade">
                <span class="title-icon">{{ appStore.currentArtisanTitle.icon }}</span>
                <span class="title-text">恭喜晋升：{{ levelResult.newTitle }}</span>
              </div>
              <div class="stars-display">
                <span v-for="star in 3" :key="star" class="result-star" :class="{ 'filled': star <= levelResult.stars }">
                  {{ star <= levelResult.stars ? '⭐' : '☆' }}
                </span>
              </div>
              <div class="result-stats">
                <div class="stat-row">
                  <span class="stat-label">答对题数</span>
                  <span class="stat-value">{{ levelResult.correctCount }} / {{ levelResult.totalCount }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">用时</span>
                  <span class="stat-value">{{ levelResult.timeUsed }}秒</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">最高连击</span>
                  <span class="stat-value">{{ levelResult.maxCombo }}x</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">获得分数</span>
                  <span class="stat-value">+{{ levelResult.scoreGained }}</span>
                </div>
              </div>
              <div class="complete-actions">
                <button class="btn btn-primary" @click="backToLevelSelect">返回关卡</button>
                <button 
                  v-if="levelResult.stars >= 2 && appStore.currentLevel < 6" 
                  class="btn btn-secondary"
                  @click="nextLevel"
                >
                  下一关 →
                </button>
                <button 
                  v-if="levelResult.stars >= 2 && appStore.currentLevel === 6" 
                  class="btn btn-gold"
                  @click="backToLevelSelect"
                >
                  🏆 成为传承者
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()

const selectedAnswer = ref(null)
const showResult = ref(false)
const isCorrect = ref(false)
const showLevelComplete = ref(false)
const levelResult = ref({})
const showComboEffect = ref(false)
const comboDisplay = ref(0)
const timeUp = ref(false)
const sortedOptions = ref([])
const dragIndex = ref(-1)

const currentQuestion = computed(() => {
  return appStore.currentLevelQuestions[appStore.currentLevelIndex] || null
})

const isLastQuestion = computed(() => {
  return appStore.currentLevelIndex >= appStore.currentLevelQuestions.length - 1
})

const canSubmit = computed(() => {
  if (currentQuestion.value?.type === 'sort') {
    return sortedOptions.value.length > 0
  }
  return selectedAnswer.value !== null
})

const resultClass = computed(() => {
  if (timeUp.value) return 'time-up'
  return isCorrect.value ? 'correct' : 'wrong'
})

const resultIcon = computed(() => {
  if (timeUp.value) return '⏰'
  return isCorrect.value ? '✅' : '❌'
})

const resultTitle = computed(() => {
  if (timeUp.value) return '时间到！'
  return isCorrect.value ? '回答正确！' : '回答错误'
})

const resultMessage = computed(() => {
  if (timeUp.value) return '很遗憾，时间用完了'
  if (isCorrect.value) {
    const score = 20 + appStore.currentLevel * 10 + Math.min(appStore.comboCount - 1, 5) * 5
    return `太棒了！+${score}分${appStore.comboCount > 1 ? ` 🔥连击x${appStore.comboCount}` : ''}`
  }
  return '别灰心，继续努力！'
})

const getTypeLabel = (type) => {
  const labels = {
    judge: '判断题',
    choice: '选择题',
    match: '连线题',
    fill: '填空题',
    sort: '排序题',
    comprehensive: '综合题'
  }
  return labels[type] || '选择题'
}

const checkSortCorrect = () => {
  if (!currentQuestion.value || currentQuestion.value.type !== 'sort') return false
  return JSON.stringify(sortedOptions.value.map((opt, idx) => currentQuestion.value.options.indexOf(opt))) === JSON.stringify(currentQuestion.value.answer)
}

const selectLevel = (level) => {
  if (level <= appStore.unlockedLevels) {
    appStore.startChallengeMode(level)
    if (currentQuestion.value?.type === 'sort') {
      sortedOptions.value = [...currentQuestion.value.options]
    }
  }
}

const selectAnswer = (index) => {
  if (!showResult.value && !timeUp.value) {
    selectedAnswer.value = index
  }
}

const startDrag = (index) => {
  dragIndex.value = index
}

const dropItem = (index) => {
  if (dragIndex.value === -1 || dragIndex.value === index) return
  const item = sortedOptions.value.splice(dragIndex.value, 1)[0]
  sortedOptions.value.splice(index, 0, item)
  dragIndex.value = -1
}

const submitAnswer = () => {
  if (currentQuestion.value?.type === 'sort') {
    const answerIndices = sortedOptions.value.map((opt, idx) => currentQuestion.value.options.indexOf(opt))
    const result = appStore.submitLevelAnswer(answerIndices)
    isCorrect.value = result.isCorrect
    showResult.value = true
  } else {
    if (selectedAnswer.value === null) return
    const result = appStore.submitLevelAnswer(selectedAnswer.value)
    isCorrect.value = result.isCorrect
    showResult.value = true
  }
  
  if (isCorrect.value && appStore.comboCount > 1) {
    comboDisplay.value = appStore.comboCount
    showComboEffect.value = true
    setTimeout(() => {
      showComboEffect.value = false
    }, 1500)
  }
}

const nextQuestion = () => {
  if (isLastQuestion.value) {
    const result = appStore.completeLevel()
    const scoreBefore = appStore.score - (20 * appStore.currentLevel * result.correctCount)
    levelResult.value = {
      ...result,
      scoreGained: appStore.score - scoreBefore
    }
    showLevelComplete.value = true
  } else {
    appStore.nextLevelQuestion()
    selectedAnswer.value = null
    showResult.value = false
    timeUp.value = false
    if (currentQuestion.value?.type === 'sort') {
      sortedOptions.value = [...currentQuestion.value.options]
    }
  }
}

const backToLevelSelect = () => {
  appStore.resetChallengeMode()
  showLevelComplete.value = false
  selectedAnswer.value = null
  showResult.value = false
  timeUp.value = false
  sortedOptions.value = []
}

const nextLevel = () => {
  showLevelComplete.value = false
  appStore.startChallengeMode(appStore.currentLevel + 1)
  selectedAnswer.value = null
  showResult.value = false
  timeUp.value = false
  if (currentQuestion.value?.type === 'sort') {
    sortedOptions.value = [...currentQuestion.value.options]
  }
}

const dismissDanmaku = () => {
  showLevelComplete.value = false
}

const goToNotebook = () => {
  window.location.href = '/notebook'
}

watch(() => appStore.currentLevelQuestions, () => {
  if (currentQuestion.value?.type === 'sort') {
    sortedOptions.value = [...currentQuestion.value.options]
  }
}, { immediate: true })

watch(() => appStore.remainingTime, (newTime) => {
  if (newTime === 0 && appStore.isTimerRunning && !showResult.value) {
    timeUp.value = true
    showResult.value = true
    appStore.comboCount = 0
  }
})

onUnmounted(() => {
  appStore.stopTimer()
})
</script>

<style scoped>
.level-select-section {
  padding: 60px 0;
  background: linear-gradient(180deg, var(--bg-light) 0%, white 100%);
}

.section-title {
  text-align: center;
  margin-bottom: 40px;
}

.section-title h2 {
  font-size: 32px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.section-title p {
  font-size: 16px;
  color: var(--text-light);
}

.artisan-title-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.08), rgba(218, 165, 32, 0.05));
  padding: 25px;
  border-radius: 16px;
  margin-bottom: 40px;
  border: 2px solid rgba(178, 34, 34, 0.2);
}

.title-icon {
  font-size: 56px;
}

.title-info h3 {
  font-size: 22px;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.title-info p {
  font-size: 14px;
  color: var(--text-light);
}

.title-progress {
  flex: 1;
  text-align: right;
}

.title-progress .progress-bar {
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}

.title-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #B22222, #DAA520);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.title-progress span {
  font-size: 14px;
  color: var(--text-light);
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.level-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  position: relative;
}

.level-card:hover:not(.locked) {
  transform: translateY(-8px);
  box-shadow: 0 12px 35px rgba(178, 34, 34, 0.15);
  border-color: var(--primary-color);
}

.level-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-card.completed {
  border-color: var(--success-color);
}

.level-card.boss {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.level-card.boss .level-info h3,
.level-card.boss .level-info p,
.level-card.boss .level-type {
  color: white;
}

.level-card.boss .level-action {
  background: linear-gradient(135deg, #DAA520, #C9A96E);
}

.level-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.level-info h3 {
  font-size: 20px;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.level-info p {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 10px;
}

.level-type {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(178, 34, 34, 0.1);
  color: #B22222;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.level-stars {
  margin-bottom: 15px;
}

.star {
  font-size: 20px;
  margin-right: 4px;
}

.level-action {
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
}

.review-section {
  margin-bottom: 40px;
}

.review-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(218, 165, 32, 0.05));
  padding: 25px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(139, 69, 19, 0.2);
}

.review-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(139, 69, 19, 0.2);
}

.review-icon {
  font-size: 48px;
}

.review-info h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.review-info p {
  font-size: 14px;
  color: var(--text-light);
}

.stats-summary {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 30px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
}

.quiz-section {
  padding: 60px 0;
  background: var(--bg-light);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 16px;
  cursor: pointer;
  margin-right: 15px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(178, 34, 34, 0.1);
}

.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 25px;
  color: white;
  font-weight: 500;
}

.score-badge {
  font-size: 18px;
  font-weight: 600;
  padding: 10px 20px;
  background: white;
  border-radius: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-right: 15px;
}

.title-badge {
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.1), rgba(178, 34, 34, 0.1));
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 20px;
  color: #8B4513;
}

.quiz-progress {
  margin-bottom: 20px;
}

.progress-info span {
  font-size: 14px;
  color: var(--text-light);
}

.progress-bar-container {
  position: relative;
}

.progress-bar {
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 6px;
  transition: width 0.5s ease;
}

.timer-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.timer-bar-container {
  flex: 1;
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, #27AE60, #F39C12);
  border-radius: 5px;
  transition: width 1s linear;
}

.timer-bar.warning {
  background: linear-gradient(90deg, #F39C12, #E74C3C);
}

.timer-bar.danger {
  background: #E74C3C;
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.timer-display.warning {
  background: rgba(243, 156, 18, 0.1);
}

.timer-display.danger {
  background: rgba(231, 76, 60, 0.1);
  animation: shake 0.5s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.combo-effect {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  pointer-events: none;
}

.combo-text {
  font-size: 48px;
  font-weight: 700;
  color: #F39C12;
  text-shadow: 0 0 20px rgba(243, 156, 18, 0.5);
}

.combo-enter-active {
  animation: comboPop 0.5s ease-out;
}

.combo-leave-active {
  animation: comboFade 0.5s ease-out;
}

@keyframes comboPop {
  0% { transform: translate(-50%, -50%) scale(0); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

@keyframes comboFade {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
}

.quiz-container {
  max-width: 700px;
  margin: 0 auto;
}

.quiz-question {
  background: white;
  padding: 30px;
  border-radius: 16px;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  position: relative;
}

.quiz-question h3 {
  font-size: 20px;
  color: var(--text-dark);
  line-height: 1.6;
}

.question-type {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 4px 12px;
  background: rgba(178, 34, 34, 0.1);
  color: #B22222;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.quiz-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;
}

.judge-options {
  grid-template-columns: 1fr 1fr;
}

.fill-options {
  grid-template-columns: repeat(4, 1fr);
}

.sort-options {
  grid-template-columns: 1fr;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.fill-btn {
  flex-direction: column;
  gap: 8px;
  padding: 15px;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: rgba(178, 34, 34, 0.05);
  transform: translateY(-3px);
}

.option-btn.selected {
  border-color: var(--primary-color);
  background: rgba(178, 34, 34, 0.1);
}

.option-btn.correct {
  border-color: #27AE60;
  background: rgba(39, 174, 96, 0.1);
  animation: correctPulse 0.5s ease;
}

.option-btn.wrong {
  border-color: #E74C3C;
  background: rgba(231, 76, 60, 0.1);
  animation: shake 0.5s ease;
}

.option-btn.time-up {
  border-color: #95A5A6;
  background: rgba(149, 165, 166, 0.1);
}

@keyframes correctPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.option-btn:disabled {
  cursor: default;
}

.option-icon {
  font-size: 24px;
}

.option-letter {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-light);
  border-radius: 50%;
  font-weight: 600;
  color: var(--text-dark);
  transition: all 0.3s ease;
}

.option-btn.selected .option-letter {
  background: var(--primary-color);
  color: white;
}

.option-btn.correct .option-letter {
  background: #27AE60;
  color: white;
}

.option-btn.wrong .option-letter {
  background: #E74C3C;
  color: white;
}

.option-text {
  font-size: 16px;
  color: var(--text-dark);
}

.sort-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 2px dashed var(--border-color);
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: var(--bg-light);
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: grab;
  transition: all 0.3s ease;
}

.sort-item:last-child {
  margin-bottom: 0;
}

.sort-item:hover {
  background: rgba(178, 34, 34, 0.08);
}

.sort-item.dragging {
  opacity: 0.5;
  transform: scale(1.02);
}

.sort-item.correct {
  background: rgba(39, 174, 96, 0.1);
  border: 1px solid #27AE60;
}

.sort-number {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  font-weight: 600;
  color: var(--text-dark);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sort-text {
  font-size: 16px;
  color: var(--text-dark);
}

.quiz-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn {
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 16px;
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

.btn-gold {
  background: linear-gradient(135deg, #DAA520, #C9A96E);
  color: white;
  border: 2px solid #8B4513;
}

.btn-gold:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(218, 165, 32, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-message {
  margin-top: 25px;
  padding: 25px;
  border-radius: 16px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.result-message.correct {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(39, 174, 96, 0.05));
}

.result-message.wrong {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(231, 76, 60, 0.05));
}

.result-message.time-up {
  background: linear-gradient(135deg, rgba(149, 165, 166, 0.1), rgba(149, 165, 166, 0.05));
}

.result-icon {
  font-size: 48px;
  flex-shrink: 0;
}

.result-content h4 {
  font-size: 18px;
  margin-bottom: 8px;
  color: var(--text-dark);
}

.result-content p {
  font-size: 16px;
  color: var(--text-light);
}

.correct-answer {
  margin-top: 15px;
  padding: 12px;
  background: rgba(178, 34, 34, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 500;
}

.culture-card {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-left: 4px solid var(--primary-color);
}

.culture-card h5 {
  font-size: 16px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.culture-card p {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.6;
}

.result-enter-active {
  animation: slideIn 0.3s ease;
}

.result-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.danmaku-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.danmaku-card {
  position: relative;
  text-align: center;
  padding: 50px 40px 40px;
  background: linear-gradient(135deg, #ffffff, #fefefe);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 80px rgba(178, 34, 34, 0.2);
  max-width: 500px;
  width: 90%;
  animation: danmakuBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.danmaku-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 50%;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  line-height: 1;
}

.danmaku-close:hover {
  background: rgba(231, 76, 60, 0.15);
  color: #E74C3C;
  transform: rotate(90deg);
}

.danmaku-enter-active {
  animation: danmakuFadeIn 0.3s ease;
}

.danmaku-enter-active .danmaku-card {
  animation: danmakuBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.danmaku-leave-active {
  animation: danmakuFadeOut 0.3s ease;
}

@keyframes danmakuFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes danmakuFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes danmakuBounce {
  0% { opacity: 0; transform: translateX(200px) scale(0.6); }
  40% { transform: translateX(-20px) scale(1.02); }
  60% { transform: translateX(10px) scale(0.98); }
  80% { transform: translateX(-5px) scale(1.01); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}

.complete-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.title-upgrade {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.1), rgba(178, 34, 34, 0.1));
  border-radius: 12px;
  margin-bottom: 20px;
  animation: titleGlow 1s ease infinite alternate;
}

@keyframes titleGlow {
  from { box-shadow: 0 0 20px rgba(218, 165, 32, 0.3); }
  to { box-shadow: 0 0 30px rgba(218, 165, 32, 0.5); }
}

.title-icon {
  font-size: 32px;
}

.title-text {
  font-size: 18px;
  font-weight: 600;
  color: #8B4513;
}

.level-complete h2 {
  font-size: 32px;
  color: var(--text-dark);
  margin-bottom: 20px;
}

.stars-display {
  margin-bottom: 30px;
}

.result-star {
  font-size: 40px;
  margin: 0 5px;
}

.result-star.filled {
  animation: starFill 0.5s ease forwards;
}

@keyframes starFill {
  0% { transform: scale(0) rotate(-180deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.result-stats {
  text-align: left;
  background: var(--bg-light);
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: var(--text-light);
}

.stat-value {
  font-weight: 600;
  color: var(--text-dark);
}

.complete-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@media (max-width: 768px) {
  .level-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-summary {
    flex-direction: column;
    gap: 20px;
  }
  
  .quiz-options {
    grid-template-columns: 1fr;
  }
  
  .fill-options {
    grid-template-columns: 1fr 1fr;
  }
  
  .quiz-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .result-message {
    flex-direction: column;
    text-align: center;
  }
  
  .complete-actions {
    flex-direction: column;
  }
  
  .complete-actions .btn {
    width: 100%;
  }
  
  .artisan-title-card {
    flex-direction: column;
    text-align: center;
  }
  
  .title-progress {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 22px;
  }

  .page-header p {
    font-size: 13px;
  }

  .level-card {
    padding: 15px;
  }

  .level-card h3 {
    font-size: 16px;
  }

  .quiz-question {
    font-size: 15px;
  }

  .quiz-option {
    padding: 12px 15px;
    font-size: 13px;
  }

  .fill-options {
    grid-template-columns: 1fr;
  }

  .timer {
    font-size: 16px;
  }

  .artisan-title-card {
    padding: 15px;
  }

  .container {
    padding: 0 15px;
  }
}
</style>
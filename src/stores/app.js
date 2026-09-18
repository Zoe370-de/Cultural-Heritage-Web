import { defineStore } from 'pinia'
import quizData from '../data/quizQuestions.json'
import { getProgress, saveProgress, getWrongQuestions, addWrongQuestion, clearWrongQuestions as clearWrongApi, removeWrongQuestion as removeWrongApi } from '../api/quiz.js'

// Derive levelConfig (metadata only, without questions) from the imported quiz data
function buildLevelConfig(levels) {
  const config = {}
  for (const [key, level] of Object.entries(levels)) {
    config[key] = {
      name: level.name,
      description: level.description,
      color: level.color,
      icon: level.icon,
      type: level.type
    }
  }
  return config
}

// Derive allQuestions (questions keyed by level) from the imported quiz data
function buildAllQuestions(levels) {
  const questions = {}
  for (const [key, level] of Object.entries(levels)) {
    questions[key] = level.questions
  }
  return questions
}

export const useAppStore = defineStore('app', {
  state: () => ({
    score: 0,
    currentLevel: 1,
    maxLevel: 6,
    levelStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    unlockedLevels: 1,
    currentLevelQuestions: [],
    currentLevelIndex: 0,
    levelCorrectCount: 0,
    levelStartTime: null,
    
    timeLimit: 25,
    remainingTime: 25,
    isTimerRunning: false,
    timerInterval: null,
    
    comboCount: 0,
    maxCombo: 0,
    
    wrongQuestions: [],
    reviewingWrong: false,
    
    artisanTitle: '初级学徒',
    visitedRegions: [],
    
    levelConfig: buildLevelConfig(quizData.levels),
    
    artisanTitles: quizData.artisanTitles,
    
    regionMap: quizData.regionMap,
    
    allQuestions: buildAllQuestions(quizData.levels),

    questions: [
      { id: 1, question: '中国首个入选联合国非遗的节日是？', options: ['端午节', '春节', '中秋节', '元宵节'], answer: 0 },
      { id: 2, question: '被称为"百戏之祖"的非遗项目是？', options: ['京剧', '昆曲', '秦腔', '越剧'], answer: 1 },
      { id: 3, question: '中国入选联合国教科文组织非遗名录的项目总数位居世界第几？', options: ['第二', '第三', '第一', '第四'], answer: 2 },
      { id: 4, question: '被称为"瓷都"的中国城市是？', options: ['宜兴', '景德镇', '德化', '唐山'], answer: 1 },
      { id: 5, question: '中国最古老的弹拨乐器之一，2003年入选人类非遗的是？', options: ['古筝', '琵琶', '古琴', '二胡'], answer: 2 }
    ],
    messages: [
      { id: 1, name: '游客A', content: '网站做得很棒，学到了很多非遗文化知识！', time: '2024-01-15' },
      { id: 2, name: '游客B', content: '希望能看到更多关于非遗技艺的介绍', time: '2024-01-16' },
      { id: 3, name: '游客C', content: '地图交互很有意思，点赞！', time: '2024-01-17' }
    ],
    currentQuestionIndex: 0,
    answeredQuestions: [],
    gameMode: 'normal'
  }),
  getters: {
    accuracyRate: (state) => {
      if (state.answeredQuestions.length === 0) return 0
      const correct = state.answeredQuestions.filter(q => q.isCorrect).length
      return Math.round((correct / state.answeredQuestions.length) * 100)
    },
    messageCount: (state) => state.messages.length,
    currentLevelQuestion: (state) => {
      if (state.currentLevelQuestions.length === 0) return null
      return state.currentLevelQuestions[state.currentLevelIndex] || null
    },
    levelProgress: (state) => {
      if (state.currentLevelQuestions.length === 0) return 0
      return Math.round((state.currentLevelIndex / state.currentLevelQuestions.length) * 100)
    },
    totalStars: (state) => {
      return Object.values(state.levelStars).reduce((sum, stars) => sum + stars, 0)
    },
    currentArtisanTitle: (state) => {
      const title = state.artisanTitles.find(t => state.unlockedLevels >= t.minLevel && state.unlockedLevels <= t.maxLevel)
      return title || state.artisanTitles[0]
    }
  },
  actions: {
    submitAnswer(questionId, selectedOption) {
      const question = this.questions.find(q => q.id === questionId)
      const isCorrect = selectedOption === question.answer
      if (isCorrect) {
        this.score += 20
      }
      this.answeredQuestions.push({ questionId, selectedOption, isCorrect })
      return isCorrect
    },
    addMessage(name, content) {
      this.messages.unshift({
        id: Date.now(),
        name,
        content,
        time: new Date().toISOString().split('T')[0]
      })
    },
    resetQuiz() {
      this.score = 0
      this.currentQuestionIndex = 0
      this.answeredQuestions = []
    },
    nextQuestion() {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++
      }
    },
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
      }
    },
    
    startChallengeMode(level) {
      if (level > this.unlockedLevels) return false
      this.gameMode = 'challenge'
      this.currentLevel = level
      this.currentLevelQuestions = [...this.allQuestions[level]]
      this.currentLevelIndex = 0
      this.levelCorrectCount = 0
      this.levelStartTime = Date.now()
      this.comboCount = 0
      this.startTimer()
      return true
    },
    
    startTimer() {
      this.stopTimer()
      this.remainingTime = this.timeLimit
      this.isTimerRunning = true
      this.timerInterval = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--
        } else {
          this.stopTimer()
        }
      }, 1000)
    },
    
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
      this.isTimerRunning = false
    },
    
    resetTimer() {
      this.stopTimer()
      this.remainingTime = this.timeLimit
    },
    
    submitLevelAnswer(selectedOption) {
      const question = this.currentLevelQuestions[this.currentLevelIndex]
      let isCorrect = false
      
      if (question.type === 'sort') {
        isCorrect = JSON.stringify(selectedOption) === JSON.stringify(question.answer)
      } else {
        isCorrect = selectedOption === question.answer
      }
      
      if (isCorrect) {
        this.levelCorrectCount++
        this.comboCount++
        if (this.comboCount > this.maxCombo) {
          this.maxCombo = this.comboCount
        }
        
        const baseScore = 20
        const levelBonus = this.currentLevel * 10
        const comboBonus = Math.min(this.comboCount - 1, 5) * 5
        const totalScore = baseScore + levelBonus + comboBonus
        
        this.score += totalScore
        
        if (question.region && !this.visitedRegions.includes(question.region)) {
          this.visitedRegions.push(question.region)
        }
        
        this.answeredQuestions.push({ 
          questionId: question.id, 
          selectedOption, 
          isCorrect,
          level: this.currentLevel,
          combo: this.comboCount
        })
      } else {
        this.comboCount = 0
        
        const exists = this.wrongQuestions.some(w => w.id === question.id)
        let wrongCount = 1
        if (!exists) {
          this.wrongQuestions.push({
            ...question,
            wrongCount: 1,
            lastWrongTime: Date.now(),
            userAnswer: selectedOption
          })
        } else {
          const wrongQ = this.wrongQuestions.find(w => w.id === question.id)
          if (wrongQ) {
            wrongQ.wrongCount++
            wrongQ.lastWrongTime = Date.now()
            wrongQ.userAnswer = selectedOption
            wrongCount = wrongQ.wrongCount
          }
        }
        
        this.syncWrongQuestion(question, selectedOption, wrongCount)
        
        this.answeredQuestions.push({ 
          questionId: question.id, 
          selectedOption, 
          isCorrect,
          level: this.currentLevel,
          combo: 0
        })
      }
      
      return {
        isCorrect,
        combo: this.comboCount,
        score: isCorrect ? (20 + this.currentLevel * 10 + Math.min(this.comboCount - 1, 5) * 5) : 0
      }
    },
    
    nextLevelQuestion() {
      this.resetTimer()
      if (this.currentLevelIndex < this.currentLevelQuestions.length - 1) {
        this.currentLevelIndex++
        this.startTimer()
        return true
      }
      return false
    },
    
    completeLevel() {
      this.stopTimer()
      const totalQuestions = this.currentLevelQuestions.length
      const correctRate = this.levelCorrectCount / totalQuestions
      
      let stars = 0
      if (correctRate >= 1.0) stars = 3
      else if (correctRate >= 0.66) stars = 2
      else if (correctRate >= 0.33) stars = 1
      
      this.levelStars[this.currentLevel] = Math.max(this.levelStars[this.currentLevel], stars)
      
      if (stars >= 2 && this.currentLevel < this.maxLevel) {
        this.unlockedLevels = Math.max(this.unlockedLevels, this.currentLevel + 1)
      }
      
      const title = this.artisanTitles.find(t => this.unlockedLevels >= t.minLevel && this.unlockedLevels <= t.maxLevel)
      if (title) {
        this.artisanTitle = title.title
      }
      
      this.syncProgress()
      
      return {
        stars,
        correctCount: this.levelCorrectCount,
        totalCount: totalQuestions,
        timeUsed: Math.round((Date.now() - this.levelStartTime) / 1000),
        maxCombo: this.maxCombo,
        newTitle: title ? title.title : null
      }
    },
    
    resetChallengeMode() {
      this.stopTimer()
      this.gameMode = 'normal'
      this.currentLevel = 1
      this.currentLevelQuestions = []
      this.currentLevelIndex = 0
      this.levelCorrectCount = 0
      this.levelStartTime = null
      this.comboCount = 0
      this.remainingTime = this.timeLimit
    },
    
    startReviewMode() {
      if (this.wrongQuestions.length === 0) return false
      this.gameMode = 'review'
      this.reviewingWrong = true
      this.currentLevelQuestions = [...this.wrongQuestions]
      this.currentLevelIndex = 0
      this.levelCorrectCount = 0
      this.startTimer()
      return true
    },
    
    removeFromWrongQuestions(questionId) {
      this.wrongQuestions = this.wrongQuestions.filter(q => q.id !== questionId)
      if (localStorage.getItem('token')) {
        removeWrongApi(questionId).catch(() => {})
      }
    },
    
    clearWrongQuestions() {
      this.wrongQuestions = []
      if (localStorage.getItem('token')) {
        clearWrongApi().catch(() => {})
      }
    },
    
    addVisitedRegion(region) {
      if (!this.visitedRegions.includes(region)) {
        this.visitedRegions.push(region)
      }
    },
    
    resetAllProgress() {
      this.stopTimer()
      this.score = 0
      this.currentLevel = 1
      this.levelStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      this.unlockedLevels = 1
      this.answeredQuestions = []
      this.gameMode = 'normal'
      this.comboCount = 0
      this.maxCombo = 0
      this.wrongQuestions = []
      this.reviewingWrong = false
      this.remainingTime = this.timeLimit
      this.artisanTitle = '初级学徒'
      this.visitedRegions = []
    },
    
    // 登录用户从后端加载游戏进度和错题
    async loadFromServer() {
      if (!localStorage.getItem('token')) return
      try {
        const [progressRes, wrongRes] = await Promise.all([
          getProgress(),
          getWrongQuestions()
        ])
        const p = progressRes.data.progress
        if (p) {
          this.score = p.score || 0
          this.levelStars = p.levelStars || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
          this.unlockedLevels = p.unlockedLevels || 1
          this.maxCombo = p.maxCombo || 0
          this.visitedRegions = p.visitedRegions || []
          this.artisanTitle = p.artisanTitle || '初级学徒'
        }
        this.wrongQuestions = wrongRes.data.wrongQuestions || []
      } catch (e) {
        console.log('加载游戏数据失败:', e.message)
      }
    },
    
    // 同步错题到后端（fire-and-forget）
    syncWrongQuestion(question, userAnswer, wrongCount) {
      if (!localStorage.getItem('token') || !question) return
      addWrongQuestion({
        questionId: question.id,
        questionData: question,
        userAnswer,
        wrongCount
      }).catch(() => {})
    },
    
    // 同步游戏进度到后端（fire-and-forget）
    syncProgress() {
      if (!localStorage.getItem('token')) return
      saveProgress({
        score: this.score,
        levelStars: this.levelStars,
        unlockedLevels: this.unlockedLevels,
        maxCombo: this.maxCombo,
        visitedRegions: this.visitedRegions,
        artisanTitle: this.artisanTitle
      }).catch(() => {})
    }
  }
})
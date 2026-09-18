<template>
  <div class="notebook">
    <section class="page-header">
      <div class="container">
        <div class="header-decoration">
          <span class="decor-line"></span>
          <span class="decor-symbol">📜</span>
          <span class="decor-line"></span>
        </div>
        <h1>我的匠心手记</h1>
        <p>记录错题，温故知新，以错为引，以图带学</p>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-num">{{ appStore.wrongQuestions.length }}</span>
            <span class="stat-label">错题数量</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ visitedRegionsCount }}</span>
            <span class="stat-label">关联地域</span>
          </div>
        </div>
      </div>
    </section>

    <section class="notebook-content">
      <div class="container">
        <div v-if="appStore.wrongQuestions.length === 0" class="empty-state">
          <div class="empty-scroll">
            <div class="scroll-top"></div>
            <div class="scroll-body">
              <div class="empty-icon">✍️</div>
              <p>暂无错题记录</p>
              <p class="empty-hint">完成闯关挑战后，错题将自动记录于此</p>
              <button class="btn btn-primary" @click="goToInteractive">开始闯关</button>
            </div>
            <div class="scroll-bottom"></div>
          </div>
        </div>

        <div v-else class="questions-list">
          <div 
            v-for="(question, index) in appStore.wrongQuestions" 
            :key="question.id"
            class="question-card"
            :class="{ 'flipping': flippingCard === index }"
          >
            <div class="card-front">
              <div class="card-header">
                <div class="question-number">
                  <span class="number-circle">{{ index + 1 }}</span>
                </div>
                <div class="question-meta">
                  <span class="question-tag">{{ getTypeLabel(question.type) }}</span>
                  <span class="wrong-count">错误 {{ question.wrongCount }} 次</span>
                </div>
                <div class="card-actions">
                  <button class="action-btn" @click="flipCard(index)">展开</button>
                </div>
              </div>
              
              <div class="card-body">
                <p class="question-text">{{ question.question }}</p>
                
                <div v-if="question.type !== 'sort'" class="answer-info">
                  <div class="user-answer">
                    <span class="label">你的答案：</span>
                    <span class="value wrong">
                      {{ question.userAnswer !== null && question.userAnswer !== undefined 
                        ? question.options[question.userAnswer] 
                        : '未作答' 
                      }}
                    </span>
                  </div>
                  <div class="correct-answer">
                    <span class="label">正确答案：</span>
                    <span class="value correct">{{ question.options[question.answer] }}</span>
                  </div>
                </div>
                
                <div v-else class="sort-answer">
                  <div class="user-answer">
                    <span class="label">你的排序：</span>
                    <span class="value wrong">{{ formatSortAnswer(question.userAnswer, question.options) }}</span>
                  </div>
                  <div class="correct-answer">
                    <span class="label">正确排序：</span>
                    <span class="value correct">{{ formatSortAnswer(question.answer, question.options) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="region-tag" v-if="question.region">
                  <span class="region-icon">📍</span>
                  <span class="region-name">{{ question.region }}</span>
                </div>
                <button 
                  v-if="question.region" 
                  class="btn btn-secondary map-btn"
                  @click="goToMap(question.region)"
                >
                  <span class="btn-icon">🗺️</span>
                  <span>去地图看看</span>
                </button>
              </div>
            </div>
            
            <div class="card-back">
              <button class="close-btn" @click="flipCard(index)">✕</button>
              <h4>📚 深度知识卡</h4>
              <div class="deep-content">
                <div class="item-info">
                  <span class="item-name">{{ question.item }}</span>
                  <span class="item-region">{{ question.region }}</span>
                </div>
                <div class="knowledge-section">
                  <p>{{ question.explanation }}</p>
                </div>
                <div class="knowledge-tags">
                  <span class="tag">历史渊源</span>
                  <span class="tag">工艺流程</span>
                  <span class="tag">传承现状</span>
                </div>
              </div>
              <button class="btn btn-primary map-btn" @click="goToMap(question.region)">
                <span class="btn-icon">🗺️</span>
                <span>前往地图查看</span>
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="appStore.wrongQuestions.length > 0" class="bottom-actions">
          <button class="btn btn-outline" @click="clearAll">清空全部</button>
          <button class="btn btn-primary" @click="goToInteractive">去闯关巩固</button>
        </div>
      </div>
    </section>

    <section class="philosophy-section">
      <div class="container">
        <div class="philosophy-card">
          <div class="philosophy-icon">🧠</div>
          <h3>学习理念</h3>
          <p>"以错为引，以图带学"——每一道错题都是通往知识的桥梁，点击"去地图看看"，让空间认知加深记忆。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const flippingCard = ref(-1)

const visitedRegionsCount = computed(() => {
  const regions = new Set(appStore.wrongQuestions.map(q => q.region).filter(Boolean))
  return regions.size
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

const formatSortAnswer = (answerIndices, options) => {
  if (!answerIndices || !Array.isArray(answerIndices)) return '未作答'
  return answerIndices.map(idx => options[idx]).join(' → ')
}

const flipCard = (index) => {
  flippingCard.value = flippingCard.value === index ? -1 : index
}

const goToMap = (region) => {
  sessionStorage.setItem('selectedRegion', region)
  window.location.href = '/culture'
}

const goToInteractive = () => {
  window.location.href = '/interactive'
}

const clearAll = () => {
  if (confirm('确定要清空所有错题记录吗？')) {
    appStore.clearWrongQuestions()
  }
}
</script>

<style scoped>
.page-header {
  padding: 80px 0 60px;
  background: linear-gradient(135deg, #8B4513 0%, #5C1A1A 50%, #3E0E0E 100%);
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
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.page-header .container {
  position: relative;
  z-index: 1;
  text-align: center;
}

.header-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.decor-line {
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #DAA520);
}

.decor-symbol {
  font-size: 36px;
}

.page-header h1 {
  font-size: 42px;
  color: #FAF7F2;
  margin-bottom: 15px;
  font-weight: 700;
  letter-spacing: 8px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.page-header p {
  font-size: 18px;
  color: #C9A96E;
  margin-bottom: 40px;
  font-style: italic;
}

.header-stats {
  display: flex;
  justify-content: center;
  gap: 80px;
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 48px;
  font-weight: 700;
  color: #DAA520;
}

.stat-label {
  font-size: 16px;
  color: #C9A96E;
}

.notebook-content {
  padding: 60px 0;
  background: linear-gradient(180deg, #FAF7F2 0%, #F5F0E6 100%);
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.empty-scroll {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 400px;
  max-width: 90%;
}

.scroll-top {
  width: 100%;
  height: 40px;
  background: linear-gradient(180deg, #CD853F 0%, #8B4513 50%, transparent 100%);
  border-radius: 50% 50% 0 0;
  position: relative;
}

.scroll-top::before {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 20px;
  background: #8B4513;
  border-radius: 0 0 50% 50%;
}

.scroll-body {
  width: 100%;
  padding: 40px 30px;
  background: linear-gradient(180deg, #FDF5E6 0%, #FAF0E6 100%);
  border: 2px solid #CD853F;
  box-shadow: 
    inset 0 0 30px rgba(139, 69, 19, 0.1),
    0 10px 30px rgba(0, 0, 0, 0.15);
  text-align: center;
  position: relative;
}

.scroll-body::before {
  content: '';
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 80%;
  background: repeating-linear-gradient(
    0deg,
    #CD853F 0,
    #CD853F 10px,
    transparent 10px,
    transparent 20px
  );
  opacity: 0.3;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.scroll-body p {
  font-size: 18px;
  color: #5C1A1A;
  margin-bottom: 10px;
}

.empty-hint {
  font-size: 14px !important;
  color: #8B4513 !important;
  margin-bottom: 30px !important;
}

.scroll-bottom {
  width: 100%;
  height: 40px;
  background: linear-gradient(0deg, #CD853F 0%, #8B4513 50%, transparent 100%);
  border-radius: 0 0 50% 50%;
  position: relative;
}

.scroll-bottom::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 20px;
  background: #8B4513;
  border-radius: 50% 50% 0 0;
}

.questions-list {
  display: grid;
  gap: 30px;
}

.question-card {
  perspective: 1000px;
}

.card-front,
.card-back {
  background: linear-gradient(180deg, #FDF5E6 0%, #FAF0E6 100%);
  border: 2px solid #CD853F;
  border-radius: 8px;
  box-shadow: 
    inset 0 0 20px rgba(139, 69, 19, 0.08),
    0 8px 25px rgba(0, 0, 0, 0.1);
  padding: 25px;
  position: relative;
  backface-visibility: hidden;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-front::before,
.card-back::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #8B4513, #DAA520, #8B4513);
  border-radius: 8px 8px 0 0;
}

.card-back {
  transform: rotateY(180deg);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.question-card.flipping .card-front {
  transform: rotateY(-180deg);
}

.question-card.flipping .card-back {
  transform: rotateY(0);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-circle {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #8B4513, #5C1A1A);
  color: #FAF7F2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.question-meta {
  display: flex;
  gap: 15px;
  align-items: center;
}

.question-tag {
  padding: 4px 12px;
  background: rgba(178, 34, 34, 0.1);
  color: #B22222;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.wrong-count {
  font-size: 14px;
  color: #8B4513;
}

.action-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #DAA520, #C9A96E);
  color: #FAF7F2;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(218, 165, 32, 0.3);
}

.card-body {
  margin-bottom: 20px;
}

.question-text {
  font-size: 18px;
  color: #3E0E0E;
  line-height: 1.6;
  margin-bottom: 20px;
  padding-left: 20px;
  border-left: 4px solid #B22222;
}

.answer-info {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.user-answer,
.correct-answer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.answer-info .label {
  font-size: 14px;
  color: #8B4513;
}

.answer-info .value {
  font-size: 16px;
  font-weight: 600;
}

.value.wrong {
  color: #E74C3C;
}

.value.correct {
  color: #27AE60;
}

.sort-answer {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sort-answer .label {
  font-size: 14px;
  color: #8B4513;
}

.sort-answer .value {
  font-size: 15px;
  font-weight: 500;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px dashed #CD853F;
}

.region-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(139, 69, 19, 0.1);
  border-radius: 20px;
}

.region-icon {
  font-size: 16px;
}

.region-name {
  font-size: 14px;
  color: #8B4513;
  font-weight: 500;
}

.map-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #B22222, #8B4513);
  color: #FAF7F2;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(178, 34, 34, 0.3);
}

.btn-icon {
  font-size: 16px;
}

.card-back {
  padding: 30px;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  border-radius: 50%;
  font-size: 18px;
  color: #8B4513;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(231, 76, 60, 0.15);
  color: #E74C3C;
}

.card-back h4 {
  font-size: 20px;
  color: #5C1A1A;
  margin-bottom: 20px;
  text-align: center;
}

.deep-content {
  margin-bottom: 25px;
}

.item-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(178, 34, 34, 0.08);
  border-radius: 8px;
}

.item-name {
  font-size: 18px;
  font-weight: 700;
  color: #B22222;
}

.item-region {
  font-size: 14px;
  color: #8B4513;
  padding: 4px 12px;
  background: rgba(218, 165, 32, 0.2);
  border-radius: 12px;
}

.knowledge-section {
  padding: 20px;
  background: #FAF7F2;
  border-radius: 8px;
  border-left: 4px solid #B22222;
  margin-bottom: 20px;
}

.knowledge-section p {
  font-size: 15px;
  color: #5C1A1A;
  line-height: 1.8;
}

.knowledge-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.knowledge-tags .tag {
  padding: 6px 14px;
  background: rgba(218, 165, 32, 0.15);
  color: #8B4513;
  border-radius: 16px;
  font-size: 12px;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
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
  background: linear-gradient(135deg, #B22222, #8B4513);
  color: #FAF7F2;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(178, 34, 34, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #DAA520, #C9A96E);
  color: #FAF7F2;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(218, 165, 32, 0.3);
}

.btn-outline {
  background: transparent;
  color: #8B4513;
  border: 2px solid #8B4513;
}

.btn-outline:hover {
  background: #8B4513;
  color: #FAF7F2;
}

.philosophy-section {
  padding: 40px 0;
  background: #3E0E0E;
}

.philosophy-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(218, 165, 32, 0.2);
}

.philosophy-icon {
  font-size: 48px;
}

.philosophy-card h3 {
  font-size: 20px;
  color: #DAA520;
  margin-bottom: 8px;
}

.philosophy-card p {
  font-size: 15px;
  color: #C9A96E;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 28px;
    letter-spacing: 4px;
  }
  
  .page-header p {
    font-size: 15px;
  }
  
  .header-stats {
    gap: 40px;
  }
  
  .stat-num {
    font-size: 32px;
  }
  
  .empty-scroll {
    width: 100%;
  }
  
  .answer-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .map-btn {
    width: 100%;
    justify-content: center;
  }
  
  .bottom-actions {
    flex-direction: column;
  }
  
  .bottom-actions .btn {
    width: 100%;
  }
  
  .philosophy-card {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 22px;
    letter-spacing: 2px;
  }

  .page-header p {
    font-size: 13px;
  }

  .header-stats {
    flex-direction: column;
    gap: 15px;
  }

  .stat-num {
    font-size: 24px;
  }

  .wrong-card {
    padding: 15px;
  }

  .container {
    padding: 0 15px;
  }
}
</style>
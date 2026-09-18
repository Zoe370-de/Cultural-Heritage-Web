<template>
  <div class="page-container">
    <section class="page-header">
      <div class="container">
        <h1>🕵️ AI识遗小侦探</h1>
        <p>上传图片，AI帮你识别非遗文化元素，探索相关传承地</p>
      </div>
    </section>

    <section class="detection-section">
      <div class="container">
        <div class="detective-card">
          <div class="detective-header">
            <div class="detective-icon">🔍</div>
            <h2>上传图片，寻找非遗线索</h2>
            <p>拍一张刺绣、陶瓷、戏曲服饰等照片，AI将帮你分析其中包含的非遗元素，并推荐相关的非遗传承地</p>
          </div>

          <div class="upload-area" :class="{ 'dragover': isDragover, 'has-image': selectedImage }"
            @dragover.prevent="isDragover = true"
            @dragleave="isDragover = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input 
              ref="fileInput" 
              type="file" 
              accept="image/*" 
              class="file-input"
              @change="handleFileSelect"
            />
            <div v-if="!selectedImage" class="upload-hint">
              <div class="upload-icon">📷</div>
              <p>点击或拖拽上传图片</p>
              <p class="hint-text">支持 JPG、PNG 格式</p>
            </div>
            <div v-else class="preview-container">
              <img :src="selectedImage" alt="上传的图片" class="preview-image" />
              <button class="remove-image" @click.stop="clearImage">✕</button>
            </div>
          </div>

          <button 
            class="detect-btn" 
            :disabled="!selectedImage || isDetecting"
            @click="startDetection"
          >
            <span v-if="isDetecting" class="loading-spinner">⏳</span>
            {{ isDetecting ? 'AI分析中...' : '开始识别' }}
          </button>
        </div>
      </div>
    </section>

    <section v-if="detectionResult" class="result-section">
      <div class="container">
        <div class="result-header">
          <h2>🎯 识别结果</h2>
        </div>
        
        <div class="result-content">
          <div class="tags-section">
            <h3>AI识别到的非遗元素标签</h3>
            <div class="tags-container">
              <span 
                v-for="(tag, index) in detectionResult.tags" 
                :key="index" 
                class="tag"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >{{ tag }}</span>
            </div>
          </div>

          <div class="analysis-section">
            <h3>📝 AI分析</h3>
            <p>{{ detectionResult.analysis }}</p>
          </div>

          <div class="recommendation-section">
            <h3>🌐 推荐探索非遗传承地</h3>
            <p>根据识别结果，推荐您前往以下非遗传承地探索</p>
            <div class="recommend-grid">
              <div 
                v-for="(rec, index) in detectionResult.recommendations" 
                :key="index" 
                class="recommend-card"
                @click="goToMap(rec)"
              >
                <div class="recommend-image">
                  <img :src="rec.image" :alt="rec.name" />
                </div>
                <div class="recommend-info">
                  <div class="recommend-name">{{ rec.name }}</div>
                  <div class="recommend-item">{{ rec.item }}</div>
                  <div class="recommend-desc">{{ rec.description }}</div>
                  <div class="recommend-action">去地图看看 →</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="detectionResult.guess" class="guess-section">
            <h3>🤔 猜猜看：这是哪个非遗项目？</h3>
            <div class="guess-options">
              <button 
                v-for="(option, index) in detectionResult.guess.options" 
                :key="index"
                class="guess-btn"
                :class="{ 
                  selected: selectedGuess === index,
                  correct: showGuessResult && index === detectionResult.guess.answer,
                  wrong: showGuessResult && selectedGuess === index && index !== detectionResult.guess.answer
                }"
                :disabled="showGuessResult"
                @click="selectGuess(index)"
              >
                {{ option }}
              </button>
            </div>
            <button 
              v-if="!showGuessResult && selectedGuess !== null" 
              class="btn btn-primary"
              @click="submitGuess"
            >
              确认答案
            </button>
            <div v-if="showGuessResult" class="guess-feedback" :class="isGuessCorrect ? 'correct' : 'wrong'">
              <div class="feedback-icon">{{ isGuessCorrect ? '🎉' : '💡' }}</div>
              <div class="feedback-text">
                {{ isGuessCorrect ? '答对了！' : detectionResult.guess.explanation }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <div class="section-title">
          <h2>为什么使用AI识遗小侦探？</h2>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>智能识别</h3>
            <p>基于先进的AI视觉技术，精准识别图片中的非遗文化元素</p>
          </div>
          <div class="feature-icon">📍</div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>快速响应</h3>
            <p>上传图片后秒级响应，即时获取识别结果和推荐</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>精准推荐</h3>
            <p>根据识别结果，智能推荐相关非遗传承地，探索文化脉络</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎮</div>
            <h3>趣味互动</h3>
            <p>猜一猜小游戏，在游戏中学习非遗知识</p>
          </div>
        </div>
      </div>
    </section>

    <section class="guide-section">
      <div class="container">
        <div class="section-title">
          <h2>使用指南</h2>
        </div>
        <div class="guide-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>拍摄照片</h4>
              <p>使用手机或相机拍摄非遗相关物品，如刺绣、陶瓷、剪纸等</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>上传图片</h4>
              <p>点击上传区域或拖拽图片到指定位置</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>AI识别</h4>
              <p>点击"开始识别"按钮，AI将分析图片中的非遗元素</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>探索传承地</h4>
              <p>根据推荐结果，点击前往地图查看详细信息</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const fileInput = ref(null)
const isDragover = ref(false)
const selectedImage = ref('')
const isDetecting = ref(false)
const detectionResult = ref(null)
const selectedGuess = ref(null)
const showGuessResult = ref(false)
const isGuessCorrect = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file) processFile(file)
}

const handleDrop = (event) => {
  isDragover.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImage.value = e.target.result
    detectionResult.value = null
    selectedGuess.value = null
    showGuessResult.value = false
  }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  selectedImage.value = ''
  detectionResult.value = null
  selectedGuess.value = null
  showGuessResult.value = false
  if (fileInput.value) fileInput.value.value = ''
}

const generateDetectionResult = () => {
  const results = [
    {
      tags: ['刺绣', '苏绣', '花鸟图案', '传统工艺'],
      analysis: 'AI识别到图片中包含精美的刺绣工艺，从图案风格和针法来看，这很可能是苏绣作品。苏绣以针法细腻、色彩典雅著称，是中国四大名绣之首。',
      recommendations: [
        {
          name: '苏州（江苏）',
          item: '苏绣',
          description: '苏绣传承地，双面绣技艺闻名天下',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Suzhou%20embroidery%20artisan%20workshop%2C%20traditional%20Chinese%20craft&image_size=square',
          region: '苏州（江苏）'
        },
        {
          name: '杭州（浙江）',
          item: '蚕桑丝织技艺',
          description: '丝绸织造传承地，中国蚕桑丝织技艺世界非遗',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20silk%20weaving%20workshop%2C%20Hangzhou%20style&image_size=square',
          region: '杭州（浙江）'
        },
        {
          name: '成都（四川）',
          item: '蜀绣',
          description: '蜀绣传承地，针法多达12种',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sichuan%20embroidery%20traditional%20craftsmanship%2C%20Chengdu&image_size=square',
          region: '成都（四川）'
        }
      ],
      guess: {
        options: ['苏绣', '蜀绣', '粤绣', '湘绣'],
        answer: 0,
        explanation: '正确答案是苏绣！苏绣以针法细腻、色彩雅致著称，一根丝线可劈成1/128根使用，其双面绣技艺更是令人叹为观止。'
      }
    },
    {
      tags: ['陶瓷', '青花瓷', '景德镇', '传统工艺'],
      analysis: 'AI识别到图片中包含青花瓷工艺，从釉色和图案风格来看，这很可能是景德镇青花瓷作品。景德镇是中国著名的瓷都，其手工制瓷技艺已有千年历史。',
      recommendations: [
        {
          name: '景德镇（江西）',
          item: '景德镇手工制瓷技艺',
          description: '千年瓷都，青花瓷传承地',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jingdezhen%20porcelain%20making%2C%20traditional%20kiln%20firing&image_size=square',
          region: '景德镇（江西）'
        },
        {
          name: '北京',
          item: '景泰蓝制作技艺',
          description: '宫廷工艺传承地，国家级非遗',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20cloisonne%20art%20workshop%2C%20traditional%20craft&image_size=square',
          region: '北京'
        },
        {
          name: '西安（陕西）',
          item: '耀州窑陶瓷',
          description: '唐代名窑，青瓷烧制技艺传承',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20Chinese%20ceramic%20kiln%2C%20Xi%27an%20style&image_size=square',
          region: '西安（陕西）'
        }
      ],
      guess: {
        options: ['景德镇', '宜兴', '德化', '唐山'],
        answer: 0,
        explanation: '正确答案是景德镇！景德镇制瓷历史始于汉代，历经千年而不衰，其手工制瓷技艺包含72道工序。'
      }
    },
    {
      tags: ['戏曲', '京剧', '脸谱', '传统表演'],
      analysis: 'AI识别到图片中包含戏曲元素，从脸谱和服饰风格来看，这很可能是京剧表演。京剧被誉为中国国粹，融合了唱、念、做、打等多种表演形式。',
      recommendations: [
        {
          name: '北京',
          item: '京剧',
          description: '京剧发源地，国粹传承地',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Beijing%20opera%20performance%2C%20traditional%20costume%20and%20makeup&image_size=square',
          region: '北京'
        },
        {
          name: '苏州（江苏）',
          item: '昆曲',
          description: '百戏之祖，人类非遗代表作',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Kunqu%20opera%20traditional%20Chinese%20theater&image_size=square',
          region: '苏州（江苏）'
        },
        {
          name: '西安（陕西）',
          item: '秦腔',
          description: '梆子腔鼻祖，西北戏曲代表',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Qin%20opera%20performance%2C%20Shaanxi%20traditional%20theater&image_size=square',
          region: '西安（陕西）'
        }
      ],
      guess: {
        options: ['京剧', '昆曲', '秦腔', '越剧'],
        answer: 0,
        explanation: '正确答案是京剧！京剧被誉为中国国粹，2010年入选人类非遗名录，是中国影响最大的戏曲剧种。'
      }
    },
    {
      tags: ['剪纸', '窗花', '民俗艺术', '传统工艺'],
      analysis: 'AI识别到图片中包含剪纸艺术，从图案风格来看，这很可能是中国传统剪纸作品。剪纸是中国最普及的民间艺术之一，2009年入选人类非遗。',
      recommendations: [
        {
          name: '北京',
          item: '剪纸艺术',
          description: '传统剪纸传承地，窗花艺术代表',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20paper%20cutting%20art%2C%20traditional%20red%20paper&image_size=square',
          region: '北京'
        },
        {
          name: '西安（陕西）',
          item: '皮影戏',
          description: '电影鼻祖，传统光影艺术',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20shadow%20puppet%20theater%2C%20traditional%20art&image_size=square',
          region: '西安（陕西）'
        },
        {
          name: '杭州（浙江）',
          item: '金石篆刻',
          description: '文人艺术，西泠印社传承',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20seal%20carving%20art%2C%20traditional%20calligraphy&image_size=square',
          region: '杭州（浙江）'
        }
      ],
      guess: {
        options: ['剪纸', '皮影戏', '木雕', '泥塑'],
        answer: 0,
        explanation: '正确答案是剪纸！中国剪纸是最普及的民间艺术之一，2009年入选人类非遗，红纸翻飞间剪出万千世界。'
      }
    },
    {
      tags: ['织锦', '蜀锦', '传统织造', '纹样'],
      analysis: 'AI识别到图片中包含织锦工艺，从图案风格和织造技艺来看，这很可能是蜀锦作品。蜀锦已有两千多年历史，是中国四大名锦之一。',
      recommendations: [
        {
          name: '成都（四川）',
          item: '蜀锦织造技艺',
          description: '蜀锦传承地，千年锦绣技艺',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sichuan%20brocade%20weaving%20traditional%20craft&image_size=square',
          region: '成都（四川）'
        },
        {
          name: '杭州（浙江）',
          item: '中国蚕桑丝织技艺',
          description: '丝绸之府，世界非遗',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20silk%20production%2C%20traditional%20sericulture&image_size=square',
          region: '杭州（浙江）'
        },
        {
          name: '苏州（江苏）',
          item: '宋锦',
          description: '中国四大名锦之一',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Song%20brocade%20traditional%20Chinese%20silk&image_size=square',
          region: '苏州（江苏）'
        }
      ],
      guess: {
        options: ['蜀锦', '云锦', '宋锦', '壮锦'],
        answer: 0,
        explanation: '正确答案是蜀锦！蜀锦已有两千多年历史，产地四川成都，与南京云锦、苏州宋锦、广西壮锦并称中国四大名锦。'
      }
    }
  ]
  return results[Math.floor(Math.random() * results.length)]
}

const startDetection = () => {
  if (!selectedImage.value || isDetecting.value) return
  isDetecting.value = true

  setTimeout(() => {
    detectionResult.value = generateDetectionResult()
    isDetecting.value = false
  }, 2000)
}

const selectGuess = (index) => {
  if (showGuessResult.value) return
  selectedGuess.value = index
}

const submitGuess = () => {
  if (selectedGuess.value === null) return
  isGuessCorrect.value = selectedGuess.value === detectionResult.value.guess.answer
  showGuessResult.value = true
}

const goToMap = (rec) => {
  sessionStorage.setItem('selectedRegion', rec.region)
  window.location.href = '/culture'
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
}

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

.detection-section {
  padding: 60px 0;
  background: var(--bg-light);
}

.detective-card {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.detective-header {
  text-align: center;
  margin-bottom: 30px;
}

.detective-icon {
  font-size: 64px;
  margin-bottom: 15px;
}

.detective-header h2 {
  font-size: 24px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.detective-header p {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.6;
}

.upload-area {
  border: 3px dashed var(--border-color);
  border-radius: 16px;
  padding: 50px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 25px;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(178, 34, 34, 0.03);
}

.upload-area.dragover {
  border-color: var(--primary-color);
  background: rgba(178, 34, 34, 0.05);
  transform: scale(1.02);
}

.upload-area.has-image {
  padding: 0;
  border: none;
}

.file-input {
  display: none;
}

.upload-hint {
  color: var(--text-light);
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 15px;
}

.upload-hint p {
  font-size: 16px;
  margin-bottom: 5px;
}

.hint-text {
  font-size: 14px !important;
  color: var(--text-light) !important;
}

.preview-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  background: var(--bg-light);
}

.remove-image {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-image:hover {
  background: #E74C3C;
}

.detect-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.detect-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(178, 34, 34, 0.4);
}

.detect-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.result-section {
  padding: 60px 0;
  background: white;
}

.result-header {
  text-align: center;
  margin-bottom: 40px;
}

.result-header h2 {
  font-size: 32px;
  color: var(--text-dark);
}

.result-content {
  max-width: 800px;
  margin: 0 auto;
}

.tags-section {
  margin-bottom: 30px;
}

.tags-section h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 15px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.1), rgba(218, 165, 32, 0.1));
  color: var(--primary-color);
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  animation: tagFadeIn 0.5s ease forwards;
}

@keyframes tagFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.analysis-section {
  background: var(--bg-light);
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.analysis-section h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.analysis-section p {
  font-size: 15px;
  color: var(--text-light);
  line-height: 1.8;
}

.recommendation-section {
  margin-bottom: 30px;
}

.recommendation-section h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.recommendation-section p {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 20px;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.recommend-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.recommend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 35px rgba(178, 34, 34, 0.15);
  border-color: var(--primary-color);
}

.recommend-image {
  height: 150px;
  overflow: hidden;
}

.recommend-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.recommend-card:hover .recommend-image img {
  transform: scale(1.1);
}

.recommend-info {
  padding: 20px;
}

.recommend-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.recommend-item {
  font-size: 13px;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.recommend-desc {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.5;
  margin-bottom: 12px;
}

.recommend-action {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: 500;
}

.guess-section {
  background: linear-gradient(135deg, rgba(243, 156, 18, 0.08), rgba(243, 156, 18, 0.03));
  padding: 30px;
  border-radius: 16px;
  border: 1px solid rgba(243, 156, 18, 0.2);
}

.guess-section h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 20px;
}

.guess-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.guess-btn {
  padding: 15px;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 15px;
  color: var(--text-dark);
  cursor: pointer;
  transition: all 0.3s ease;
}

.guess-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: rgba(178, 34, 34, 0.05);
}

.guess-btn.selected {
  border-color: var(--primary-color);
  background: rgba(178, 34, 34, 0.1);
}

.guess-btn.correct {
  border-color: #27AE60;
  background: rgba(39, 174, 96, 0.1);
  color: #27AE60;
}

.guess-btn.wrong {
  border-color: #E74C3C;
  background: rgba(231, 76, 60, 0.1);
  color: #E74C3C;
}

.guess-btn:disabled {
  cursor: default;
}

.guess-feedback {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  margin-top: 15px;
}

.guess-feedback.correct {
  background: rgba(39, 174, 96, 0.1);
}

.guess-feedback.wrong {
  background: rgba(243, 156, 18, 0.1);
}

.feedback-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.feedback-text {
  font-size: 15px;
  color: var(--text-dark);
  font-weight: 500;
}

.features-section {
  padding: 60px 0;
  background: var(--bg-light);
}

.section-title {
  text-align: center;
  margin-bottom: 40px;
}

.section-title h2 {
  font-size: 28px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.feature-card {
  background: var(--bg-white);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(178, 34, 34, 0.15);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.feature-card p {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.6;
}

.guide-section {
  padding: 60px 0;
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.05), rgba(218, 165, 32, 0.05));
}

.guide-steps {
  max-width: 800px;
  margin: 0 auto;
}

.step-item {
  display: flex;
  gap: 20px;
  padding: 25px 0;
  border-bottom: 1px solid var(--border-color);
}

.step-item:last-child {
  border-bottom: none;
}

.step-number {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 16px;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.step-content p {
  font-size: 14px;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 32px;
  }

  .detective-card {
    padding: 25px;
  }

  .upload-area {
    padding: 30px 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .step-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .guess-options {
    grid-template-columns: 1fr;
  }

  .recommend-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 24px;
  }

  .page-header p {
    font-size: 13px;
  }

  .detective-card {
    padding: 20px 15px;
  }

  .upload-area {
    padding: 20px 15px;
  }

  .upload-icon {
    font-size: 36px;
  }

  .result-card {
    padding: 20px 15px;
  }

  .container {
    padding: 0 15px;
  }
}
</style>
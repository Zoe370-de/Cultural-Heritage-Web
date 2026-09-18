<template>
  <div class="home">
    <section class="banner">
      <div class="banner-bg">
        <div class="pattern-overlay"></div>
      </div>
      <div class="banner-content">
        <div class="banner-text animate-fadeInUp">
          <h1>匠心传承</h1>
          <p>全国代表性手工技艺类非遗</p>
          <router-link to="/culture" class="btn btn-primary">探索匠心</router-link>
        </div>
        <div class="banner-decoration">
          <div class="decor-circle"></div>
          <div class="decor-circle small"></div>
          <div class="decor-circle tiny"></div>
        </div>
      </div>
      <div class="scroll-indicator">
        <span>向下滚动</span>
        <div class="scroll-arrow"></div>
      </div>
    </section>

    <section class="intro">
      <div class="container">
        <div class="section-title">
          <h2>匠心之道</h2>
        </div>
        <div class="intro-content">
          <div class="intro-text">
            <p>匠心，是对技艺的执着追求，是对传统的敬畏传承。每一位非遗传承人，都在用双手书写着中华文化的传奇篇章。</p>
            <p>从景德镇窑火中诞生的精美瓷器，到苏州绣坊里绽放的锦绣芳华，从梨园舞台上的婉转唱腔，到剪纸窗花里的民俗风情——每一项非遗，都是匠人心血的凝结，是中华民族智慧的结晶。</p>
            <p>中国已有43个项目列入联合国教科文组织非物质文化遗产名录，位居世界第一。让我们一起走进匠人的世界，感受非遗之美。</p>
          </div>
          <div class="intro-image">
            <div class="image-wrapper">
              <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20craftsman%20hands%20working%20on%20pottery%2C%20warm%20lighting%2C%20artisan%20workshop&image_size=square" alt="匠心传承">
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <div class="section-title">
          <h2>匠心技艺</h2>
        </div>
        <div class="features-grid">
          <div 
            v-for="(feature, index) in features" 
            :key="index" 
            class="feature-card card"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @click="$router.push(feature.link)"
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <router-link :to="feature.link" class="feature-link" @click.stop>了解匠人 →</router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="artisans">
      <div class="container">
        <div class="section-title">
          <h2>匠人故事</h2>
          <p>聆听传承人的匠心坚守</p>
        </div>
        <div class="artisans-grid">
          <div 
            v-for="(artisan, index) in artisans" 
            :key="index" 
            class="artisan-card card"
            @click="showArtisanDetail(artisan)"
          >
            <div class="artisan-avatar">
              <div class="avatar-icon">{{ artisan.icon }}</div>
            </div>
            <div class="artisan-info">
              <h3>{{ artisan.name }}</h3>
              <p class="artisan-title">{{ artisan.title }}</p>
              <p class="artisan-desc">{{ artisan.description }}</p>
              <div class="artisan-tags">
                <span v-for="tag in artisan.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="artisan-arrow">→</div>
          </div>
        </div>
      </div>
    </section>

    <section class="highlight">
      <div class="container">
        <div class="highlight-content">
          <div class="highlight-text">
            <h2>走进非遗世界</h2>
            <p>从传统手工艺到民间表演艺术，从节庆民俗到中医药文化，中国非遗浩如烟海、博大精深。让我们一起走进这个充满智慧与美感的文化宝库。</p>
            <router-link to="/culture" class="btn btn-primary">开始探索</router-link>
          </div>
          <div class="highlight-images">
            <div class="highlight-img img-1">
              <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20paper%20cutting%20art%2C%20red%20color%2C%20intricate%20detail&image_size=square" alt="传统剪纸">
            </div>
            <div class="highlight-img img-2">
              <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jingdezhen%20traditional%20porcelain%20making%2C%20craftsman%20at%20work&image_size=square" alt="景德镇瓷器">
            </div>
            <div class="highlight-img img-3">
              <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20Peking%20opera%20mask%2C%20traditional%20costume%2C%20colorful&image_size=square" alt="京剧脸谱">
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="artisan-modal" :class="{ 'show': selectedArtisan }" @click.self="closeArtisanDetail">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-icon">{{ selectedArtisan?.icon }}</div>
          <h3>{{ selectedArtisan?.name }}</h3>
          <p>{{ selectedArtisan?.title }}</p>
        </div>
        <div class="modal-body">
          <p>{{ selectedArtisan?.detail }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeArtisanDetail">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const features = ref([
  {
    icon: '🎭',
    title: '戏曲匠心',
    description: '昆曲、京剧、皮影戏等传统戏剧，每一个唱念做打都是匠人心血的凝结。',
    link: '/culture'
  },
  {
    icon: '🏺',
    title: '陶瓷技艺',
    description: '景德镇手工制瓷、宜兴紫砂陶，72道工序铸就千年匠心传奇。',
    link: '/culture'
  },
  {
    icon: '🏮',
    title: '民俗传承',
    description: '端午节、中秋节等传统节日，代代相传的不仅是习俗，也是文化基因。',
    link: '/culture'
  },
  {
    icon: '🪡',
    title: '锦绣工艺',
    description: '苏绣、蜀锦织造等传统手工艺，一针一线编织中华美学。',
    link: '/culture'
  }
])

const artisans = ref([
  {
    icon: '👨‍🎨',
    name: '王师傅',
    title: '景德镇陶瓷大师',
    description: '从艺40年，传承古法制瓷技艺，让青花瓷在新时代绽放光彩。',
    tags: ['陶瓷', '青花瓷', '国家级传承人'],
    detail: '王师傅出生于景德镇陶瓷世家，自幼跟随祖父学习制瓷技艺。40年来，他始终坚持传统手工制瓷，从选土、揉泥、拉坯、修坯到绘画、上釉、烧制，每一道工序都精益求精。他的青花瓷作品曾多次获得国内外大奖，被誉为"当代青花第一人"。王师傅说："制瓷不仅是手艺，更是一种修行。每一件瓷器都承载着匠人的心血和情感，只有用心去做，才能做出真正有灵魂的作品。"'
  },
  {
    icon: '👩‍🎨',
    name: '李绣娘',
    title: '苏绣传承人',
    description: '三代绣娘传承，苏绣双面绣技艺的坚守者。',
    tags: ['苏绣', '双面绣', '非遗传承人'],
    detail: '李绣娘是苏绣世家第三代传承人，从小在母亲的绣架旁长大。她的双面绣作品《猫》曾作为国礼赠送外国元首。李绣娘说："苏绣讲究的是针脚细腻、色彩典雅。一幅好的苏绣作品，往往需要数月甚至数年才能完成。但每当看到作品完成的那一刻，所有的辛苦都值得了。我要把这门技艺传承下去，让更多人了解苏绣的美。"'
  },
  {
    icon: '🎭',
    name: '张老师',
    title: '京剧表演艺术家',
    description: '梅派传人，用一生演绎国粹之美。',
    tags: ['京剧', '梅派', '表演艺术'],
    detail: '张老师是京剧梅派艺术的传人，师从著名京剧表演艺术家。她从事京剧表演50余年，主演过《贵妃醉酒》《霸王别姬》等经典剧目。张老师说："京剧是中国的国粹，每一个眼神、每一个动作都蕴含着深厚的文化内涵。作为传承人，我不仅要把技艺传承下去，更要让年轻一代感受到京剧的魅力，让这门古老的艺术焕发新的生机。"'
  }
])

const selectedArtisan = ref(null)

const showArtisanDetail = (artisan) => {
  selectedArtisan.value = artisan
}

const closeArtisanDetail = () => {
  selectedArtisan.value = null
}
</script>

<style scoped>
.banner {
  position: relative;
  height: 100vh;
  min-height: 600px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #5C1A1A 0%, rgba(178, 34, 34, 0.9) 35%, rgba(197, 140, 61, 0.85) 65%, #5C1A1A 100%);
}

.pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a76a' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.banner-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
  max-width: 800px;
  padding: 0 20px;
}

.banner-text h1 {
  font-size: 56px;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 4px;
}

.banner-text p {
  font-size: 24px;
  margin-bottom: 30px;
  opacity: 0.9;
  letter-spacing: 2px;
}

.banner-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.decor-circle {
  position: absolute;
  border: 2px solid rgba(255, 215, 0, 0.25);
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

.decor-circle:nth-child(1) {
  width: 400px;
  height: 400px;
  top: -200px;
  left: -200px;
  animation-delay: 0s;
  border-color: rgba(255, 215, 0, 0.12);
}

.decor-circle.small {
  width: 200px;
  height: 200px;
  top: 100px;
  left: 150px;
  animation-delay: 1s;
  border-color: rgba(255, 215, 0, 0.08);
}

.decor-circle.tiny {
  width: 100px;
  height: 100px;
  top: -50px;
  left: 200px;
  animation-delay: 2s;
  border-color: rgba(255, 215, 0, 0.15);
}

.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: white;
  animation: bounce 2s ease-in-out infinite;
}

.scroll-arrow {
  width: 20px;
  height: 30px;
  border: 2px solid white;
  border-radius: 10px;
  margin: 10px auto;
  position: relative;
}

.scroll-arrow::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 8px;
  background: white;
  border-radius: 2px;
  animation: scroll 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(10px); }
}

@keyframes scroll {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}

.intro {
  padding: 80px 0;
  background: var(--bg-white);
}

.intro-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  align-items: center;
}

.section-title {
  text-align: center;
  margin-bottom: 50px;
}

.section-title h2 {
  font-size: 32px;
  color: var(--text-dark);
  position: relative;
  display: inline-block;
}

.section-title h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 2px;
}

.intro-text p {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-light);
  margin-bottom: 16px;
}

.intro-image {
  display: flex;
  justify-content: center;
}

.image-wrapper {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.image-wrapper:hover {
  transform: scale(1.02);
}

.image-wrapper img {
  width: 100%;
  display: block;
}

.features {
  padding: 100px 0;
  background: linear-gradient(180deg, #FAF7F2 0%, #ffffff 100%);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
}

.feature-card {
  padding: 40px 30px;
  text-align: center;
  opacity: 0;
  animation: fadeInUp 0.6s ease forwards;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50% 20px 50% 20px;
  border: 1px solid rgba(178, 34, 34, 0.08);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(178, 34, 34, 0.05) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.feature-card:hover {
  border-radius: 20px 50% 20px 50%;
  transform: translateY(-12px) rotate(2deg);
  box-shadow: 0 20px 50px rgba(178, 34, 34, 0.15);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon {
  font-size: 56px;
  margin-bottom: 24px;
  display: inline-block;
  width: 110px;
  height: 110px;
  line-height: 110px;
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.08) 0%, rgba(218, 165, 32, 0.08) 100%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 24px rgba(178, 34, 34, 0.15);
}

.feature-card h3 {
  font-size: 22px;
  margin-bottom: 16px;
  color: var(--text-dark);
  font-weight: 600;
}

.feature-card p {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 20px;
  line-height: 1.6;
}

.feature-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.feature-link:hover {
  color: var(--secondary-color);
}

.artisans {
  padding: 100px 0;
  background: var(--bg-white);
}

.artisans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.artisan-card {
  display: flex;
  align-items: center;
  padding: 30px;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.artisan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(178, 34, 34, 0.1);
  border-color: rgba(178, 34, 34, 0.2);
}

.artisan-avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.1) 0%, rgba(218, 165, 32, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.artisan-info {
  flex: 1;
  min-width: 0;
}

.artisan-info h3 {
  font-size: 20px;
  margin-bottom: 5px;
  color: var(--text-dark);
}

.artisan-title {
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 8px;
}

.artisan-desc {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.5;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.artisan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.artisan-tags .tag {
  padding: 4px 12px;
  background: rgba(178, 34, 34, 0.08);
  color: var(--primary-color);
  font-size: 12px;
  border-radius: 12px;
}

.artisan-arrow {
  font-size: 20px;
  color: var(--text-light);
  transition: all 0.3s ease;
}

.artisan-card:hover .artisan-arrow {
  color: var(--primary-color);
  transform: translateX(5px);
}

.artisan-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.artisan-modal.show {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.artisan-modal.show .modal-content {
  transform: scale(1);
}

.modal-header {
  padding: 30px;
  text-align: center;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header .modal-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  margin: 0 auto 20px;
}

.modal-header h3 {
  font-size: 24px;
  margin-bottom: 5px;
}

.modal-header p {
  font-size: 14px;
  opacity: 0.9;
}

.modal-body {
  padding: 30px;
}

.modal-body p {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-dark);
}

.modal-footer {
  padding: 20px 30px;
  text-align: center;
  border-top: 1px solid var(--border-color);
}

.modal-footer button {
  padding: 12px 30px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.modal-footer button:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.highlight {
  padding: 80px 0;
  background: linear-gradient(135deg, #3C1A1A 0%, var(--primary-color) 50%, var(--secondary-color) 100%);
  position: relative;
  overflow: hidden;
}

.highlight::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 500px;
  height: 500px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  pointer-events: none;
}

.highlight-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  align-items: center;
  color: white;
  position: relative;
  z-index: 1;
}

.highlight-text h2 {
  font-size: 32px;
  margin-bottom: 20px;
}

.highlight-text p {
  font-size: 16px;
  line-height: 1.8;
  opacity: 0.9;
  margin-bottom: 30px;
}

.highlight-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 12px;
}

.highlight-img {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.highlight-img:hover {
  transform: scale(1.03);
}

.highlight-img img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}

.highlight-img.img-1 {
  grid-row: 1 / -1;
}

.highlight-img.img-1 img {
  height: 100%;
  min-height: 292px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 0.5; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .banner {
    height: auto;
    min-height: 400px;
    padding: 80px 20px 60px;
  }

  .banner-text h1 {
    font-size: 32px;
  }

  .banner-text p {
    font-size: 16px;
  }

  .banner-decoration {
    display: none;
  }

  .scroll-indicator {
    animation: none;
    bottom: 20px;
  }

  .scroll-arrow::after {
    animation: none;
  }

  .intro {
    padding: 60px 0;
  }

  .intro-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .intro-text p {
    text-align: left;
    font-size: 14px;
  }

  .image-wrapper:hover img {
    transform: none;
  }

  .features {
    padding: 60px 0;
  }

  .features-grid {
    gap: 20px;
  }

  .feature-card {
    padding: 25px 20px;
    border-radius: 12px;
    animation: none;
    opacity: 1;
  }

  .feature-card:hover {
    border-radius: 12px;
    transform: none;
    box-shadow: 0 8px 20px rgba(178, 34, 34, 0.1);
  }

  .feature-card:hover::before {
    opacity: 0;
  }

  .feature-icon {
    font-size: 40px;
    width: 80px;
    height: 80px;
    line-height: 80px;
    margin-bottom: 16px;
  }

  .feature-card:hover .feature-icon {
    transform: none;
    box-shadow: none;
  }

  .feature-card h3 {
    font-size: 18px;
    margin-bottom: 12px;
  }

  .feature-card p {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .highlight {
    padding: 60px 0;
  }

  .highlight-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 30px;
  }

  .highlight-text h2 {
    font-size: 24px;
  }

  .highlight-text p {
    font-size: 14px;
  }

  .highlight-images {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
  }

  .highlight-img.img-1 {
    grid-row: auto;
  }

  .highlight-img.img-1 img {
    min-height: auto;
    height: 120px;
  }

  .highlight-img img {
    height: 120px;
  }

  .highlight-img:hover {
    transform: none;
  }
}

@media (max-width: 480px) {
  .banner {
    min-height: 300px;
    padding: 60px 15px 40px;
  }

  .banner-text h1 {
    font-size: 24px;
  }

  .banner-text p {
    font-size: 14px;
  }

  .section-title h2 {
    font-size: 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    padding: 20px 15px;
  }

  .artisans-grid {
    grid-template-columns: 1fr;
  }

  .highlight-images {
    grid-template-columns: 1fr;
  }

  .highlight-img img {
    height: 100px;
  }

  .intro-text p {
    font-size: 13px;
  }

  .container {
    padding: 0 15px;
  }
}
</style>
<template>
  <div class="culture">
    <section class="page-header">
      <div class="container">
        <h1>匠心地图</h1>
        <p>探索中国非遗匠人足迹与传承脉络</p>
      </div>
    </section>

    <section class="map-section">
      <div class="container">
        <div class="section-title">
          <h2>匠心地图</h2>
          <p>每一位非遗传承人都是中华文化的守望者，跟随匠人的足迹，探寻千年技艺的传承脉络</p>
        </div>
        <div class="map-wrapper">
          <div ref="mapRef" class="map-container"></div>
          <button class="danmaku-toggle" @click="danmakuOn = !danmakuOn" :title="danmakuOn ? '关闭弹幕' : '开启弹幕'">
            {{ danmakuOn ? '💬 弹幕开' : ' 弹幕关' }}
          </button>
          <div class="heat-legend">
            <span class="legend-label">传承热度:</span>
            <span class="legend-item" style="background: #E8A87C"></span>
            <span class="legend-item" style="background: #D4845A"></span>
            <span class="legend-item" style="background: #C06040"></span>
            <span class="legend-item" style="background: #B22222"></span>
            <span class="legend-item" style="background: #8B1A1A"></span>
            <span class="legend-text">低</span>
            <span class="legend-text">高</span>
          </div>
          <div v-if="danmakuOn" class="danmaku-layer">
            <span
              v-for="(dm, i) in danmakuList"
              :key="i"
              class="danmaku-item"
              :style="{
                top: dm.top + '%',
                color: dm.color,
                animationDuration: dm.duration + 's',
                animationDelay: dm.delay + 's',
                fontSize: dm.fontSize + 'px'
              }"
            >{{ dm.content }}</span>
          </div>
          <div v-if="selectedRegion" class="region-popup">
            <!-- 头部栏：城市标题 + 关闭按钮 -->
            <div class="popup-header">
              <div class="popup-header-left">
                <h3 class="popup-city-name">{{ selectedRegion.name }}</h3>
                <p class="popup-city-subtitle">{{ selectedRegion.subtitle }}</p>
              </div>
              <button class="popup-close-btn" @click="closeRegionPopup">
                ✕ 关闭
              </button>
            </div>

            <!-- 骨架屏加载 -->
            <div v-if="popupLoading" class="popup-body">
              <SkeletonLoader type="list" />
            </div>

            <!-- 弹窗内容 -->
            <div v-else class="popup-body">
              <!-- 模块一：传承匠人 -->
              <div v-if="selectedRegion.artisans && selectedRegion.artisans.length > 0" class="popup-section">
                <h4 class="section-label">👥 传承匠人</h4>
                <div class="artisans-scroll">
                  <div 
	                    v-for="(artisan, i) in selectedRegion.artisans" 
	                    :key="i" 
	                    class="artisan-mini-card"
	                    @click="openArtisanDetail(artisan)"
	                  >
	                    <div class="artisan-card-avatar">{{ artisan.name.charAt(0) }}</div>
	                    <div class="artisan-card-name">{{ artisan.name }}</div>
	                    <div class="artisan-card-title">{{ artisan.title }}</div>
	                    <div class="artisan-card-detail-hint">查看详情 →</div>
	                  </div>
                </div>
              </div>

              <!-- 模块二：非遗信息 -->
              <div class="popup-section">
                <h4 class="section-label">🏺 非遗信息</h4>
                
                <div class="info-row">
                  <span class="info-label">代表技艺</span>
                  <div class="info-tags">
                    <span 
                      v-for="(tag, i) in selectedRegion.culture?.split('、')" 
                      :key="i" 
                      class="info-tag"
                    >{{ tag }}</span>
                  </div>
                </div>

                <div class="info-row">
                  <span class="info-label">民俗文化</span>
                  <span class="info-text">{{ selectedRegion.folklore }}</span>
                </div>

                <div class="info-row">
                  <span class="info-label">名胜古迹</span>
                  <div class="info-tags">
                    <span 
                      v-for="(site, i) in selectedRegion.sites?.split('、')" 
                      :key="i" 
                      class="info-tag site-tag"
                    >{{ site }}</span>
                  </div>
                </div>

                <div class="info-row">
                  <span class="info-label">传承热度</span>
                  <div class="heat-bar-wrapper">
                    <div class="heat-bar">
                      <div class="heat-bar-fill" :style="{ width: selectedRegion.heat + '%' }"></div>
                    </div>
                    <span class="heat-bar-text">{{ selectedRegion.heat }}%</span>
                  </div>
                </div>
              </div>

              <!-- 模块三：匠心故事 -->
              <div v-if="selectedRegion.deepStory" class="popup-section">
                <h4 class="section-label">📜 匠心故事</h4>
                <div class="story-box">
                  <p>{{ selectedRegion.deepStory }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 匠人详情子弹窗 -->
          <div v-if="selectedArtisanDetail" class="artisan-sub-popup">
            <div class="sub-popup-header">
              <h4>👤 匠人详情</h4>
              <button class="sub-popup-close" @click="selectedArtisanDetail = null">✕</button>
            </div>
            <div class="sub-popup-body">
              <div class="artisan-detail-header">
                <div class="artisan-detail-avatar">{{ selectedArtisanDetail.name.charAt(0) }}</div>
                <div class="artisan-detail-info">
                  <h3>{{ selectedArtisanDetail.name }}</h3>
                  <p>{{ selectedArtisanDetail.title }}</p>
                  <div v-if="selectedArtisanDetail.tags" class="artisan-tags-row">
                    <span v-for="tag in selectedArtisanDetail.tags" :key="tag" class="artisan-tag">{{ tag }}</span>
                  </div>
                </div>
              </div>
              <p class="artisan-detail-desc">{{ selectedArtisanDetail.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="timeline-section">
      <div class="container">
        <div class="section-title">
          <h2>匠心传承之路</h2>
          <p>从传统技艺到现代传承，见证非遗保护的里程碑</p>
        </div>
        <div class="timeline-wrapper">
          <div class="timeline">
            <div
              v-for="(event, index) in timelineEvents"
              :key="index"
              class="timeline-item"
              :class="{ 'active': currentTimelineIndex === index }"
              @click="setTimelineIndex(index)"
            >
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <h3>{{ event.year }}</h3>
                <h4>{{ event.title }}</h4>
                <p>{{ event.description }}</p>
              </div>
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
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <router-link :to="feature.link" class="feature-link">了解匠人 →</router-link>
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

    <section class="culture-overview">
      <div class="container">
        <div class="section-title">
          <h2>匠心技艺分类</h2>
        </div>
        <div class="overview-grid">
          <div v-for="(item, index) in cultureOverview" :key="index" class="overview-card card">
            <div class="overview-icon">{{ item.icon }}</div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <AIChat />

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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import AIChat from '../components/AIChat.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import '../api/ai.js'

const mapRef = ref(null)
let chartInstance = null

const selectedRegion = ref(null)
const popupLoading = ref(false)
const selectedArtisanDetail = ref(null)
const currentTimelineIndex = ref(0)
const danmakuOn = ref(true)
const chinaMapRegistered = ref(false)
const isZoomedIn = ref(false)
const selectedArtisan = ref(null)
const expandedStory = ref(false)

const features = [
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
    description: '端午节、中秋节等传统节日，代代相传的不仅是习俗，更是文化基因。',
    link: '/culture'
  },
  {
    icon: '🪡',
    title: '锦绣工艺',
    description: '苏绣、蜀锦织造等传统手工艺，一针一线编织中华美学。',
    link: '/culture'
  }
]

const artisans = [
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
]

const showArtisanDetail = (artisan) => {
  selectedArtisan.value = artisan
}

const closeArtisanDetail = () => {
  selectedArtisan.value = null
  selectedArtisanDetail.value = null
}

const openArtisanDetail = (artisan) => {
  selectedArtisanDetail.value = artisan
}

const closeRegionPopup = () => {
  selectedRegion.value = null
  expandedStory.value = false
  popupLoading.value = false
  selectedArtisanDetail.value = null
}

const getExtendedStory = (regionName) => {
  const stories = {
    '北京': '在这里，你可以走进故宫感受皇家气派，在颐和园的长廊上聆听历史的回响，在老舍茶馆品味一杯大碗茶的悠然。京剧的锣鼓声中，于魁智等艺术家们正用精湛的表演传承着国粹的魂脉。',
    '苏州（江苏）': '漫步平江路，昆曲的婉转唱腔从古老的戏台飘出，王芳的《牡丹亭》让杜丽娘穿越六百年时光与你相遇。绣娘姚建萍的工作室里，一根丝线被劈成1/128根，在绢帛上绽放出双面绣的奇迹。',
    '景德镇（江西）': '古窑民俗博览区里，千年窑火仍在燃烧，黄云鹏大师用五十载光阴复原了失传的古瓷配方。秦锡麟教授开创的现代青花，让传统技艺在新时代焕发新生。亲手拉一个坯，你会明白何为"土与火的艺术"。',
    '西安（陕西）': '皮影雕刻大师汪天稳的工作室里，一张张牛皮在他手中化为栩栩如生的人物。秦腔表演艺术家李梅高亢的唱腔穿透千年时光，让古城墙下的人们驻足聆听。西安鼓乐的乐师们用古老的乐谱，奏响着"中国古代音乐活化石"的千年回响。',
    '成都（四川）': '蜀锦织造大师贺斌的工作室里，织机声声，唐代"陵阳公样"在他手中复活。川剧艺术家陈巧茹的变脸绝技令人目不暇接。盖碗茶的清香中，锦里的川西民俗风情让人流连忘返。',
    '杭州（浙江）': '西泠印社的石阶上，篆刻泰斗刘江的刀锋在方寸之间刻出万千气象。中国丝绸博物馆里，赵丰馆长带领团队用科技手段修复着千年丝绸文物。西湖边的龙井茶园里，采茶姑娘的手指在嫩芽间翻飞，传承着千年的茶文化。'
  }
  return stories[regionName] || '这里承载着深厚的非遗文化底蕴，每一位传承人都在用毕生心血守护着中华文明的瑰宝。'
}

const goToArtisanDetail = (region) => {
  selectedArtisan.value = {
    name: region.name,
    icon: '📍',
    title: region.culture?.split('、')[0] || '非遗项目',
    detail: region.deepStory + '。' + getExtendedStory(region.name)
  }
}

const registerChinaMap = async () => {
  if (chinaMapRegistered.value) return
  try {
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    const chinaJson = await response.json()
    echarts.registerMap('china', chinaJson)
    chinaMapRegistered.value = true
  } catch (error) {
    console.error('加载中国地图数据失败:', error)
  }
}

const regions = [
  {
    name: '北京',
    description: '中国的文化中心，拥有京剧、景泰蓝、雕漆技艺等多项国家级非遗，是传统宫廷文化的汇聚之地。',
    culture: '京剧、景泰蓝制作技艺、北京雕漆',
    folklore: '庙会文化、老北京吆喝、天桥杂耍',
    sites: '故宫、颐和园、天坛',
    heat: 95,
    artisans: [
      { name: '张同禄', title: '景泰蓝工艺美术大师', desc: '中国工艺美术大师、国家级非遗传承人，被誉为"中国景泰蓝第一人"，作品多次作为国礼赠送外国元首。' },
      { name: '于魁智', title: '京剧表演艺术家', desc: '国家一级演员，中国戏剧梅花奖得主，工老生，代表剧目《将相和》《四郎探母》等，被誉为"京剧第一老生"。' }
    ],
    deepStory: '北京作为六朝古都，非遗文化底蕴深厚。京剧作为中国国粹，形成于清代乾隆年间，融合徽剧和汉调，经过两百多年的发展，成为中国影响最大的戏曲剧种。景泰蓝制作技艺更是皇家工艺的代表，每件作品需经过制胎、掐丝、点蓝、烧蓝等数十道工序，尽显匠心之美。'
  },
  {
    name: '苏州（江苏）',
    description: '世界文化遗产之城，以昆曲、苏绣、苏州评弹等精致典雅的非遗项目闻名天下。',
    culture: '昆曲（人类非遗）、苏绣、苏州评弹',
    folklore: '端午龙舟、中秋赏月、轧神仙庙会',
    sites: '苏州园林、平江路、山塘街',
    heat: 88,
    artisans: [
      { name: '姚建萍', title: '苏绣国家级传承人', desc: '中国工艺美术大师、国家级非遗传承人，开创"融针绣"技法，作品《丝绸之路》被中国美术馆收藏。' },
      { name: '王芳', title: '昆曲表演艺术家', desc: '中国戏剧梅花奖"二度梅"得主，工闺门旦，代表作《牡丹亭》《长生殿》等，被誉为"苏剧皇后"。' }
    ],
    deepStory: '苏州是江南文化的代表，昆曲被誉为"百戏之祖"，距今已有600多年历史，2001年被列入人类非遗代表作名录。苏绣作为中国四大名绣之首，以针法细腻、色彩典雅著称，一根丝线可劈成1/128根使用，其双面绣技艺更是令人叹为观止。'
  },
  {
    name: '景德镇（江西）',
    description: '千年瓷都，景德镇手工制瓷技艺享誉世界，是中国陶瓷文化的最高代表。',
    culture: '景德镇手工制瓷技艺、青花瓷、玲珑瓷',
    folklore: '陶瓷文化节、窑神祭祀',
    sites: '古窑民俗博览区、景德镇御窑厂',
    heat: 92,
    artisans: [
      { name: '黄云鹏', title: '仿古瓷国家级传承人', desc: '国家级非遗传承人、"中华仿古瓷第一人"，从艺50余年，复原失传古瓷配方近百种。' },
      { name: '秦锡麟', title: '陶瓷艺术大师', desc: '中国工艺美术大师，开创现代青花艺术新风格，曾任景德镇陶瓷学院院长。' }
    ],
    deepStory: '景德镇制瓷历史始于汉代，历经千年而不衰。其手工制瓷技艺包含72道工序，从选土、揉泥到拉坯、绘画、烧制，每一步都凝聚着匠人的心血。青花瓷以其典雅的蓝色图案闻名世界，是中国陶瓷文化的瑰宝，远销海内外。'
  },
  {
    name: '西安（陕西）',
    description: '十三朝古都，西安鼓乐、秦腔、皮影戏等非遗项目承载着厚重的历史文化底蕴。',
    culture: '西安鼓乐（人类非遗）、秦腔、皮影戏',
    folklore: '社火表演、关中民俗、城墙灯会',
    sites: '兵马俑、大雁塔、钟鼓楼',
    heat: 85,
    artisans: [
      { name: '汪天稳', title: '皮影戏国家级传承人', desc: '中国工艺美术大师、国家级非遗传承人，中国皮影雕刻第一人，作品被中国美术馆收藏。' },
      { name: '李梅', title: '秦腔表演艺术家', desc: '中国戏剧梅花奖"二度梅"得主，陕西省戏曲研究院院长，代表剧目《再续红梅缘》等。' }
    ],
    deepStory: '西安作为十三朝古都，是非遗文化的宝库。西安鼓乐被誉为"中国古代音乐活化石"，保留着唐宋宫廷音乐的遗韵，使用的乐器和乐谱都具有极高的历史价值。皮影戏则被称为"电影的鼻祖"，利用灯光照射兽皮制成的人物剪影来表演故事，2011年入选人类非遗。'
  },
  {
    name: '成都（四川）',
    description: '天府之国，蜀锦织造、川剧变脸、成都漆艺等非遗项目展现了巴蜀文化的独特魅力。',
    culture: '蜀锦织造技艺、川剧、成都漆艺',
    folklore: '成都灯会、川西民俗、盖碗茶文化',
    sites: '武侯祠、锦里、宽窄巷子',
    heat: 82,
    artisans: [
      { name: '贺斌', title: '蜀锦织造国家级传承人', desc: '国家级非遗传承人，掌握蜀锦全套织造工艺，曾复原唐代"陵阳公样"等失传纹样。' },
      { name: '陈巧茹', title: '川剧表演艺术家', desc: '中国戏剧梅花奖"二度梅"得主，成都市川剧研究院副院长，川剧代表性传承人。' }
    ],
    deepStory: '蜀锦已有两千多年历史，与南京云锦、苏州宋锦、广西壮锦并称中国四大名锦。其织造技艺复杂，图案精美，曾作为皇家贡品。川剧变脸更是中国戏曲中的一绝，表演者在瞬间变换脸谱，令人叹为观止，是巴蜀文化的独特代表。'
  },
  {
    name: '杭州（浙江）',
    description: '丝绸之府，中国蚕桑丝织技艺、西湖龙井茶文化、金石篆刻等非遗传承千年。',
    culture: '中国蚕桑丝织技艺（人类非遗）、金石篆刻',
    folklore: '西湖香市、钱江观潮、吴山庙会',
    sites: '西湖、灵隐寺、中国丝绸博物馆',
    heat: 86,
    artisans: [
      { name: '刘江', title: '金石篆刻大师', desc: '西泠印社执行社长、中国美术学院教授，当代篆刻艺术泰斗，著有《篆刻美学》等。' },
      { name: '赵丰', title: '纺织考古专家', desc: '中国丝绸博物馆馆长、纺织考古学家，致力于丝绸文物修复与非遗保护研究。' }
    ],
    deepStory: '杭州作为"丝绸之府"，蚕桑丝织技艺源远流长，2009年被列入人类非遗代表作名录。从养蚕、缫丝到织造、印染，每一道工序都凝聚着江南人民的智慧。金石篆刻作为文人艺术的代表，西泠印社更是被誉为"天下第一名社"，传承着中国传统篆刻艺术的精髓。'
  }
]

const culturalSites = [
  { name: '北京', value: [116.40, 39.90], region: '北京', siteCount: 14, heat: 95, ichName: '京剧、景泰蓝', desc: '六朝古都，京剧国粹诞生之地，景泰蓝皇家工艺传承中心' },
  { name: '苏州', value: [120.58, 31.30], region: '苏州（江苏）', siteCount: 10, heat: 88, ichName: '昆曲、苏绣', desc: '百戏之祖昆曲发源地，中国四大名绣苏绣之乡' },
  { name: '景德镇', value: [117.18, 29.27], region: '景德镇（江西）', siteCount: 8, heat: 92, ichName: '景德镇手工制瓷', desc: '千年瓷都，72道工序铸就青花瓷传奇' },
  { name: '西安', value: [108.94, 34.26], region: '西安（陕西）', siteCount: 12, heat: 85, ichName: '西安鼓乐、秦腔', desc: '十三朝古都，古代音乐活化石西安鼓乐传承地' },
  { name: '成都', value: [104.07, 30.67], region: '成都（四川）', siteCount: 9, heat: 82, ichName: '蜀锦、蜀绣、川剧', desc: '天府之国，蜀锦织造与川剧变脸艺术之乡' },
  { name: '杭州', value: [120.15, 30.28], region: '杭州（浙江）', siteCount: 11, heat: 86, ichName: '金石篆刻、丝绸', desc: '丝绸之府，西泠印社金石篆刻传承中心' }
]

const siteDetails = {
  '北京': { count: 14, desc: '故宫、颐和园、天坛、长城、景山公园、恭王府、北海公园、雍和宫、国子监、孔庙、南锣鼓巷、什刹海、798艺术区、国家大剧院' },
  '苏州': { count: 10, desc: '拙政园、留园、虎丘、寒山寺、平江路、山塘街、苏州博物馆、狮子林、网师园、沧浪亭' },
  '景德镇': { count: 8, desc: '古窑民俗博览区、景德镇御窑厂、三宝国际瓷谷、陶溪川文创街区、瑶里古镇、浮梁古县衙、中国陶瓷博物馆、景德镇雕塑瓷厂' },
  '西安': { count: 12, desc: '秦始皇兵马俑、大雁塔、钟鼓楼、西安城墙、华清宫、大唐芙蓉园、陕西历史博物馆、碑林博物馆、回民街、大明宫遗址、小雁塔、曲江池' },
  '成都': { count: 9, desc: '武侯祠、锦里、宽窄巷子、杜甫草堂、青羊宫、大熊猫繁育基地、文殊院、金沙遗址、都江堰' },
  '杭州': { count: 11, desc: '西湖、灵隐寺、雷峰塔、断桥、岳王庙、中国丝绸博物馆、南宋御街、河坊街、龙井村、西溪湿地、钱塘江大桥' }
}

const danmakuData = [
  { content: '中国已有43项世界级非遗 🌏', color: '#B22222', fontSize: 14 },
  { content: '昆曲被称为"百戏之祖" 🎭', color: '#DAA520', fontSize: 15 },
  { content: '景德镇是千年瓷都 🏺', color: '#C9A96E', fontSize: 13 },
  { content: '京剧是中国的国粹 🎭', color: '#B22222', fontSize: 14 },
  { content: '苏绣是中国四大名绣之首 🧵', color: '#DAA520', fontSize: 13 },
  { content: '西安鼓乐被誉为古代音乐活化石 🎵', color: '#8B4513', fontSize: 14 },
  { content: '端午节是中国首个世界级非遗 🐉', color: '#27AE60', fontSize: 15 },
  { content: '蜀锦已有两千多年历史 🧣', color: '#B22222', fontSize: 13 },
  { content: '古琴艺术是文人四艺之首 🎹', color: '#DAA520', fontSize: 14 },
  { content: '皮影戏是电影的鼻祖 🎬', color: '#C9A96E', fontSize: 13 },
  { content: '青瓷烧制技艺传承千年 💎', color: '#27AE60', fontSize: 14 },
  { content: '龙舟竞渡是端午核心活动 🚣', color: '#B22222', fontSize: 13 },
  { content: '二十四节气已列入人类非遗 🌿', color: '#DAA520', fontSize: 14 },
  { content: '剪纸艺术遍布全国各地 ✂️', color: '#E74C3C', fontSize: 13 },
  { content: '中医针灸是人类非遗项目 💉', color: '#8B4513', fontSize: 14 },
  { content: '景泰蓝需要经过数十道工序 🔷', color: '#3498DB', fontSize: 13 },
  { content: '川剧变脸是巴蜀文化一绝 🎭', color: '#E74C3C', fontSize: 15 },
  { content: '蜀绣针法多达12种 🧵', color: '#B22222', fontSize: 13 },
  { content: '西安是十三朝古都 🏯', color: '#DAA520', fontSize: 14 },
  { content: '杭州是丝绸之府 🧶', color: '#C9A96E', fontSize: 13 },
  { content: '青花瓷远销海内外 🌍', color: '#3498DB', fontSize: 14 },
  { content: '皮影戏用兽皮雕刻而成 🦁', color: '#E67E22', fontSize: 13 },
  { content: '秦腔是梆子腔的鼻祖 🎶', color: '#B22222', fontSize: 14 },
  { content: '金石篆刻是文人艺术 🔖', color: '#8B4513', fontSize: 13 },
  { content: '盖碗茶是成都特色文化 ☕', color: '#DAA520', fontSize: 14 }
]

const danmakuList = ref([])

const generateDanmaku = () => {
  danmakuList.value = danmakuData.map((dm, i) => ({
    ...dm,
    top: Math.random() * 25 + 5,
    duration: Math.random() * 10 + 16,
    delay: i * 1.8
  }))
}

const timelineEvents = [
  {
    year: '2001年',
    title: '昆曲入选人类非遗',
    description: '昆曲被联合国教科文组织列为首批"人类口头和非物质遗产代表作"，成为第一个获此殊荣的中国项目。这不仅是艺术的胜利，更是一代代昆曲传承人的坚守。'
  },
  {
    year: '2003年',
    title: '古琴艺术入选',
    description: '古琴艺术被列入人类非遗代表作名录，三千年琴韵获得世界认可。千百年来，无数琴人以琴载道，传承着文人的风骨与情怀。'
  },
  {
    year: '2005年',
    title: '国家级非遗名录建立',
    description: '国务院正式建立国家级非物质文化遗产名录体系，数千项传统技艺迎来新生。众多年逾古稀的老匠人，终于等到了技艺被认可的时刻。'
  },
  {
    year: '2009年',
    title: '大批项目集中入选',
    description: '端午节、中国书法、篆刻、剪纸等22个项目集中入选人类非遗。每一项技艺的背后，都有一群默默坚守的传承人。'
  },
  {
    year: '2011年',
    title: '《非遗法》正式施行',
    description: '《中华人民共和国非物质文化遗产法》正式施行，非遗保护进入法治化轨道。传承人的认定与保护，有了法律的坚实保障。'
  },
  {
    year: '2024年',
    title: '中国非遗世界第一',
    description: '中国入选联合国教科文组织非遗名录项目达43项，总数位居世界第一。这是中华民族的文化骄傲，也是千万匠人共同的荣耀。'
  }
]

const cultureOverview = [
  {
    icon: '🎭',
    title: '戏曲传承',
    description: '京剧、昆曲、皮影戏等传统戏曲艺术，唱念做打间尽显匠人功力，一颦一笑皆是百年积淀。'
  },
  {
    icon: '🏺',
    title: '匠心技艺',
    description: '陶瓷、织锦、漆器、金工、木作等传统手工艺，72道工序铸就千年匠心，每一件都是匠人心血的凝结。'
  },
  {
    icon: '🏮',
    title: '民俗传承',
    description: '春节、端午、中秋等传统节日，以及庙会、社火、灯会等民俗活动，承载着一代又一代人的记忆与情感。'
  },
  {
    icon: '📚',
    title: '口传心授',
    description: '史诗、传说、歌谣、谚语等口头传统，师徒相授、代代相传，是中华文明活态传承的重要载体。'
  }
]

const initMap = async () => {
  if (!mapRef.value) return

  await registerChinaMap()
  
  chartInstance = echarts.init(mapRef.value)

  chartInstance.on('click', function (params) {
    if (params.seriesType === 'map') {
      const provinceName = params.name
      const targetProvinces = ['北京', '江苏', '江西', '陕西', '四川', '浙江']
      
      if (targetProvinces.includes(provinceName) && !isZoomedIn.value) {
        isZoomedIn.value = true
        danmakuOn.value = false
        chartInstance.dispatchAction({
          type: 'geoRoam',
          animation: {
            duration: 1000,
            easing: 'cubicOut'
          }
        })
        chartInstance.setOption({
          geo: {
            center: [112, 32],
            zoom: 2.5
          },
          series: [
            {},
            {
              label: {
                show: true
              }
            },
            {}
          ]
        })
      } else if (!targetProvinces.includes(provinceName) && isZoomedIn.value) {
        isZoomedIn.value = false
        danmakuOn.value = true
        chartInstance.setOption({
          geo: {
            center: [104, 36],
            zoom: 1.2
          },
          series: [
            {},
            {
              label: {
                show: false
              }
            },
            {}
          ]
        })
      }
    }
  })

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesName === '匠人足迹') {
          const site = culturalSites.find(s => s.name === params.name)
          if (site) {
            return `<div style="font-weight:bold;margin-bottom:6px;font-size:14px;color:#3C2415;">🏙️ ${site.name}</div>
                    <div style="color:#B22222;margin-bottom:4px;font-size:13px;">� 非遗：<b>${site.ichName}</b></div>
                    <div style="color:#666;font-size:12px;max-width:200px;line-height:1.5;">${site.desc}</div>
                    <div style="color:#DAA520;font-size:11px;margin-top:4px;">🔥 传承热度：${site.heat}%</div>`
          }
          return params.name
        }
        if (['北京', '江苏', '江西', '陕西', '四川', '浙江'].includes(params.name)) {
          const provinceRegions = regions.filter(r => r.name.includes(params.name))
          const crafts = provinceRegions.map(r => r.culture?.split('、')[0]).join('、')
          return `<div style="font-weight:bold;margin-bottom:5px;">${params.name} · 匠乡</div>
                  <div style="color:#B22222;">🎨 代表技艺：${crafts}</div>
                  <div style="color:#DAA520;">🏛️ 所在城市：${provinceRegions.map(r => r.name).join('、')}</div>
                  <div style="color:#666;font-size:11px;">点击城市查看匠人详情</div>`
        }
        return params.name
      }
    },
    visualMap: {
      show: false,
      min: 80,
      max: 100,
      inRange: {
        color: ['#E8A87C', '#D4845A', '#C06040', '#B22222', '#8B1A1A']
      }
    },
    geo: {
      map: 'china',
      roam: true,
      scaleLimit: { min: 0.8, max: 12 },
      center: [104, 36],
      zoom: 1.2,
      itemStyle: {
        areaColor: '#FAF7F2',
        borderColor: '#D4C5B2',
        borderWidth: 1,
        shadowColor: 'rgba(0, 0, 0, 0.05)',
        shadowBlur: 5,
        shadowOffsetX: 0,
        shadowOffsetY: 1
      },
      emphasis: {
        itemStyle: {
          areaColor: '#F5E6D3',
          borderColor: '#B22222',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(178, 34, 34, 0.2)'
        },
        label: {
          show: true,
          color: '#3C2415',
          fontSize: 12
        }
      },
      label: {
        show: false
      },
      regions: [
        { name: '北京', label: { show: true, color: '#3C2415', fontSize: 13, fontWeight: 'bold' } },
        { name: '江苏', label: { show: true, color: '#3C2415', fontSize: 13, fontWeight: 'bold' } },
        { name: '江西', label: { show: true, color: '#3C2415', fontSize: 13, fontWeight: 'bold' } },
        { name: '陕西', label: { show: true, color: '#3C2415', fontSize: 13, fontWeight: 'bold' } },
        { name: '四川', label: { show: true, color: '#3C2415', fontSize: 13, fontWeight: 'bold' } },
        { name: '浙江', label: { show: true, color: '#3C2415', fontSize: 13, fontWeight: 'bold' } }
      ],
      layoutCenter: ['50%', '50%'],
      layoutSize: '95%'
    },
    series: [
      {
        name: '匠乡',
        type: 'map',
        map: 'china',
        geoIndex: 0,
        data: [
          { name: '北京', value: 95 },
          { name: '江苏', value: 85 },
          { name: '江西', value: 70 },
          { name: '陕西', value: 80 },
          { name: '四川', value: 75 },
          { name: '浙江', value: 82 }
        ]
      },
      {
        name: '匠人足迹',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        data: culturalSites.map(s => ({
          name: s.name,
          value: [...s.value, s.heat]
        })),
        symbolSize: 10,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 2.5,
          period: 4
        },
        itemStyle: {
          color: (params) => {
            const heat = params.value[2]
            if (heat >= 95) return '#8B1A1A'
            if (heat >= 90) return '#B22222'
            if (heat >= 86) return '#C06040'
            if (heat >= 83) return '#D4845A'
            return '#E8A87C'
          },
          shadowBlur: 8,
          shadowColor: 'rgba(178, 34, 34, 0.4)'
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          fontSize: 10,
          color: '#3C2415',
          fontWeight: 'bold',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderColor: '#DAA520',
          borderWidth: 1,
          borderRadius: 3,
          padding: [2, 5],
          labelLayout: {
            hideOverlap: true,
            moveOverlap: 'shiftY'
          }
        },
        emphasis: {
          scale: 1.8,
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(178, 34, 34, 0.6)'
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)

  chartInstance.on('click', (params) => {
    if (params.seriesName === '匠人足迹') {
      const siteData = culturalSites.find(s => s.name === params.name)
      const regionData = regions.find(r => r.name.includes(params.name))
      const d = siteDetails[params.name]
      if (d && siteData) {
        popupLoading.value = true
        selectedRegion.value = {
          name: siteData.name,
          subtitle: siteData.desc,
          culture: siteData.ichName,
          folklore: '传统节日、庙会社火、民间艺术表演',
          sites: d.desc,
          heat: siteData.heat,
          artisans: regionData?.artisans || [],
          deepStory: regionData?.deepStory || ''
        }
        setTimeout(() => { popupLoading.value = false }, 400)
      }
      return
    }
    const regionMap = {
      '北京': regions[0],
      '江苏': regions[1],
      '江西': regions[2],
      '陕西': regions[3],
      '四川': regions[4],
      '浙江': regions[5]
    }
    if (regionMap[params.name]) {
      const regionSites = culturalSites.filter(s => s.region.includes(params.name))
      const total = regionSites.reduce((sum, s) => sum + s.siteCount, 0)
      const avgHeat = Math.round(regionSites.reduce((sum, s) => sum + s.heat, 0) / regionSites.length)
      const r = regionMap[params.name]
      selectedRegion.value = {
        ...r,
        name: r.name + '（' + regionSites.length + '城' + total + '处名胜）',
        heat: avgHeat
      }
    }
  })
}

const setTimelineIndex = (index) => {
  currentTimelineIndex.value = index
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(currentTimelineIndex, (newIndex) => {
  const regionColors = ['#B22222', '#DAA520', '#C9A96E', '#8B4513', '#5C1A1A', '#B22222']
  if (chartInstance) {
    chartInstance.setOption({
      series: [{
        itemStyle: {
          emphasis: {
            areaColor: regionColors[newIndex % regionColors.length]
          }
        }
      }]
    })
  }
})

onMounted(() => {
  initMap()
  generateDanmaku()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
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

.map-section {
  padding: 80px 0;
  background: linear-gradient(180deg, var(--bg-light) 0%, #F5EFE0 50%, var(--bg-light) 100%);
  position: relative;
}

.map-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(218, 165, 32, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(178, 34, 34, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.map-wrapper {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
}

.map-container {
  height: 550px;
  border-radius: 20px;
  box-shadow: 
    0 12px 40px rgba(60, 26, 26, 0.15), 
    0 4px 12px rgba(60, 26, 26, 0.08),
    inset 0 0 0 1px rgba(218, 165, 32, 0.2);
  overflow: hidden;
  border: 2px solid rgba(218, 165, 32, 0.2);
  position: relative;
  background: linear-gradient(135deg, #FAF7F2 0%, #F5EFE0 100%);
}

.map-container::before {
  content: '';
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  bottom: 15px;
  border: 1px solid rgba(218, 165, 32, 0.15);
  border-radius: 12px;
  pointer-events: none;
  z-index: 1;
}

.danmaku-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 14px;
  background: rgba(60, 26, 26, 0.75);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  z-index: 11;
  transition: all 0.3s ease;
}

.danmaku-toggle:hover {
  background: rgba(60, 26, 26, 0.9);
}

.heat-legend {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-dark);
  z-index: 11;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.legend-label {
  font-weight: 600;
  margin-right: 4px;
}

.legend-item {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.legend-text {
  font-size: 10px;
  color: var(--text-light);
  margin: 0 2px;
}

.map-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  color: var(--primary-color);
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(178, 34, 34, 0.2);
  z-index: 9;
  pointer-events: none;
  animation: pulse 2s ease-in-out infinite;
  border: 2px solid rgba(178, 34, 34, 0.3);
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
}

.danmaku-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 10;
}

.danmaku-item {
  position: absolute;
  white-space: nowrap;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  animation: danmaku-scroll linear infinite;
  left: 100%;
  opacity: 0.55;
}

@keyframes danmaku-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100vw - 200px));
  }
}

.region-popup {
  position: absolute;
  top: 20px;
  right: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 360px;
  max-height: calc(100% - 40px);
  z-index: 10;
  animation: fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(178, 34, 34, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 头部栏 ===== */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: linear-gradient(135deg, #B22222, #8B1A1A);
  border-radius: 16px 16px 0 0;
  gap: 12px;
  flex-shrink: 0;
}

.popup-header-left {
  flex: 1;
  min-width: 0;
}

.popup-city-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
  line-height: 1.2;
}

.popup-city-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-close-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
  flex-shrink: 0;
}

.popup-close-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.5);
}

/* ===== 弹窗内容区域 ===== */
.popup-body {
  padding: 18px 20px;
  overflow-y: auto;
  flex: 1;
}

.popup-body::-webkit-scrollbar {
  width: 4px;
}

.popup-body::-webkit-scrollbar-thumb {
  background: rgba(178, 34, 34, 0.2);
  border-radius: 2px;
}

/* ===== 模块标题 ===== */
.popup-section {
  margin-bottom: 18px;
}

.popup-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 700;
  color: #3C2415;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(218, 165, 32, 0.3);
}

/* ===== 匠人横向滑动卡片 ===== */
.artisans-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 2px 10px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.artisans-scroll::-webkit-scrollbar {
  height: 4px;
}

.artisans-scroll::-webkit-scrollbar-thumb {
  background: rgba(178, 34, 34, 0.15);
  border-radius: 2px;
}

.artisan-mini-card {
  flex-shrink: 0;
  width: 110px;
  padding: 16px 10px 14px;
  background: #fff;
  border-radius: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(178, 34, 34, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  scroll-snap-align: start;
  position: relative;
  overflow: hidden;
}

.artisan-mini-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #DAA520, #B22222);
  border-radius: 0 0 3px 3px;
  opacity: 0;
  transition: opacity 0.3s;
}

.artisan-mini-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(178, 34, 34, 0.15);
  border-color: rgba(178, 34, 34, 0.25);
}

.artisan-mini-card:hover::before {
  opacity: 1;
}

.artisan-card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B22222 0%, #DAA520 100%);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  box-shadow: 0 4px 12px rgba(178, 34, 34, 0.2);
  position: relative;
}

.artisan-card-avatar::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid rgba(218, 165, 32, 0.3);
  pointer-events: none;
}

.artisan-card-name {
  font-size: 13px;
  font-weight: 600;
  color: #3C2415;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artisan-card-title {
  font-size: 11px;
  color: #8B6914;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.artisan-card-detail-hint {
  font-size: 10px;
  color: #B22222;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(178, 34, 34, 0.12);
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.3s;
}

.artisan-mini-card:hover .artisan-card-detail-hint {
  opacity: 1;
  transform: translateY(0);
}

/* ===== 非遗信息行 ===== */
.info-row {
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #8B4513;
  margin-bottom: 6px;
  display: block;
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.info-tag {
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.08), rgba(218, 165, 32, 0.08));
  border: 1px solid rgba(178, 34, 34, 0.15);
  border-radius: 12px;
  font-size: 12px;
  color: #B22222;
  font-weight: 500;
}

.site-tag {
  background: rgba(201, 169, 110, 0.1);
  border-color: rgba(201, 169, 110, 0.2);
  color: #8B6914;
}

.info-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

/* ===== 热度进度条 ===== */
.heat-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.heat-bar {
  flex: 1;
  height: 8px;
  background: #F0E8D8;
  border-radius: 4px;
  overflow: hidden;
}

.heat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #E8A87C, #B22222, #8B1A1A);
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.heat-bar-text {
  font-size: 13px;
  font-weight: 700;
  color: #B22222;
  white-space: nowrap;
}

/* ===== 匠心故事文本框 ===== */
.story-box {
  padding: 16px;
  background: linear-gradient(135deg, #FFFDF7, #FDF5E6);
  border: 1px solid rgba(218, 165, 32, 0.25);
  border-radius: 12px;
  position: relative;
  box-shadow: 
    inset 0 0 0 1px rgba(218, 165, 32, 0.1),
    0 2px 12px rgba(0, 0, 0, 0.04);
}

.story-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.3), rgba(178, 34, 34, 0.3)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.story-box p {
  font-size: 13px;
  color: #5C3A1A;
  line-height: 1.9;
  margin: 0;
  text-align: justify;
}

/* ===== 匠人详情子弹窗 ===== */
.artisan-sub-popup {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(178, 34, 34, 0.08);
  width: 340px;
  max-height: 70%;
  z-index: 20;
  animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sub-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #B22222, #8B1A1A);
  flex-shrink: 0;
}

.sub-popup-header h4 {
  margin: 0;
  font-size: 15px;
  color: #fff;
  font-weight: 600;
}

.sub-popup-close {
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.sub-popup-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.sub-popup-body {
  padding: 24px 20px;
  overflow-y: auto;
  flex: 1;
}

.sub-popup-body::-webkit-scrollbar {
  width: 4px;
}

.sub-popup-body::-webkit-scrollbar-thumb {
  background: rgba(178, 34, 34, 0.15);
  border-radius: 2px;
}

.artisan-detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(178, 34, 34, 0.08);
}

.artisan-detail-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B22222 0%, #DAA520 100%);
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(178, 34, 34, 0.25);
  position: relative;
}

.artisan-detail-avatar::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(218, 165, 32, 0.4);
  pointer-events: none;
}

.artisan-detail-info h3 {
  font-size: 18px;
  color: #3C2415;
  margin: 0 0 6px;
  font-weight: 700;
}

.artisan-detail-info p {
  font-size: 13px;
  color: #B22222;
  margin: 0;
  font-weight: 500;
}

.artisan-detail-info .artisan-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.artisan-detail-info .artisan-tag {
  padding: 2px 8px;
  background: rgba(178, 34, 34, 0.06);
  border: 1px solid rgba(178, 34, 34, 0.12);
  border-radius: 10px;
  font-size: 11px;
  color: #8B4513;
}

.artisan-detail-desc {
  font-size: 13px;
  color: #5C3A1A;
  line-height: 1.9;
  margin: 0;
  text-align: justify;
  padding: 16px;
  background: linear-gradient(135deg, #FFFDF7, #FDF5E6);
  border-radius: 12px;
  border: 1px solid rgba(218, 165, 32, 0.15);
}

.timeline-section {
  padding: 100px 0;
  background: linear-gradient(180deg, #ffffff 0%, #FAF7F2 100%);
}

.timeline-wrapper {
  margin-top: 60px;
}

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--primary-color), var(--secondary-color), var(--primary-color));
  transform: translateX(-50%);
  box-shadow: 0 0 20px rgba(178, 34, 34, 0.2);
}

.timeline-item {
  position: relative;
  margin-bottom: 50px;
  display: flex;
  align-items: center;
}

.timeline-item:nth-child(odd) .timeline-content {
  margin-right: calc(50% + 30px);
  text-align: right;
}

.timeline-item:nth-child(even) .timeline-content {
  margin-left: calc(50% + 30px);
}

.timeline-marker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 4px solid var(--primary-color);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(178, 34, 34, 0.3);
}

.timeline-item:hover .timeline-marker,
.timeline-item.active .timeline-marker {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  transform: translateX(-50%) scale(1.4);
  box-shadow: 0 0 20px rgba(178, 34, 34, 0.6), 0 4px 12px rgba(178, 34, 34, 0.4);
}

.timeline-content {
  width: calc(50% - 50px);
  padding: 25px;
  background: rgba(250, 247, 242, 0.8);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(178, 34, 34, 0.08);
}

.timeline-item:hover .timeline-content,
.timeline-item.active .timeline-content {
  background: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
  border-color: rgba(178, 34, 34, 0.15);
  transform: scale(1.02);
}

.timeline-content h3 {
  font-size: 26px;
  color: var(--primary-color);
  margin-bottom: 12px;
  font-weight: 700;
}

.timeline-content h4 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.timeline-content p {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.6;
}

.culture-overview {
  padding: 100px 0;
  background: linear-gradient(180deg, #FAF7F2 0%, #FFF0E6 50%, #FAF7F2 100%);
  position: relative;
  overflow: hidden;
}

.culture-overview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(178, 34, 34, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(218, 165, 32, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  position: relative;
  z-index: 1;
}

.overview-card {
  padding: 45px 35px;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50px 20px 50px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(178, 34, 34, 0.08);
}

.overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  opacity: 0;
  transition: opacity 0.4s ease;
}

.overview-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(178, 34, 34, 0.06) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.overview-card:hover {
  transform: translateY(-8px) rotate(2deg);
  box-shadow: 0 20px 60px rgba(178, 34, 34, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: rgba(178, 34, 34, 0.25);
  border-radius: 20px 50px 20px 50px;
}

.overview-card:hover::before {
  opacity: 1;
}

.overview-card:hover::after {
  opacity: 1;
}

.overview-icon {
  font-size: 56px;
  margin-bottom: 24px;
  display: inline-block;
  width: 100px;
  height: 100px;
  line-height: 100px;
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.08) 0%, rgba(218, 165, 32, 0.08) 100%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.overview-card:hover .overview-icon {
  transform: scale(1.1) rotate(5deg);
  background: linear-gradient(135deg, rgba(178, 34, 34, 0.12) 0%, rgba(218, 165, 32, 0.12) 100%);
  box-shadow: 0 8px 24px rgba(178, 34, 34, 0.2);
}

.overview-card h3 {
  font-size: 22px;
  margin-bottom: 16px;
  color: var(--text-dark);
  font-weight: 600;
  position: relative;
  display: inline-block;
}

.overview-card h3::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 2px;
  opacity: 0;
  transition: all 0.3s ease;
}

.overview-card:hover h3::after {
  width: 60px;
  opacity: 1;
}

.overview-card p {
  font-size: 15px;
  color: var(--text-light);
  line-height: 1.8;
  margin-top: 20px;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .map-container {
    height: 350px;
  }

  .region-popup {
    position: static;
    max-width: 100%;
    margin-top: 20px;
  }

  .heat-legend {
    display: none;
  }

  .timeline::before {
    left: 30px;
  }

  .timeline-item:nth-child(odd) .timeline-content,
  .timeline-item:nth-child(even) .timeline-content {
    margin-left: 60px;
    margin-right: 0;
    width: calc(100% - 80px);
    text-align: left;
  }

  .timeline-marker {
    left: 30px;
  }

  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .page-header h1 {
    font-size: 28px;
  }

  .section-title h2 {
    font-size: 24px;
  }

  .danmaku-layer {
    display: none;
  }

  .danmaku-toggle {
    display: none;
  }
}

@media (max-width: 480px) {
  .map-container {
    height: 280px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    padding: 60px 0 30px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .timeline-section {
    padding: 60px 0;
  }

  .features {
    padding: 60px 0;
  }

  .region-popup {
    width: calc(100% - 24px);
    right: 12px;
    max-height: 60vh;
  }

  .artisan-sub-popup {
    width: calc(100% - 32px);
  }

  .artisans-scroll {
    gap: 8px;
  }

  .artisan-mini-card {
    width: 90px;
    padding: 14px 8px 12px;
  }
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
  padding: 12px 40px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-footer button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(178, 34, 34, 0.3);
}
</style>
<template>
  <div class="product-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <SkeletonLoader type="detail" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">🔍</div>
      <h2>{{ error }}</h2>
      <p>抱歉，该商品可能已下架或不存在</p>
      <router-link to="/store" class="btn btn-primary">返回商店</router-link>
    </div>

    <!-- 商品详情 -->
    <template v-else-if="product">
      <!-- 面包屑导航 -->
      <div class="breadcrumb">
        <div class="container">
          <router-link to="/">首页</router-link>
          <span class="separator">/</span>
          <router-link to="/store">文创商店</router-link>
          <span class="separator">/</span>
          <span class="current">{{ product.categoryName || product.category_name }}</span>
        </div>
      </div>

      <!-- 商品主区域 -->
      <section class="product-hero">
        <div class="container">
          <div class="hero-grid">
            <!-- 商品大图 -->
            <div class="product-gallery">
              <div class="main-image">
                <img :src="productImage" :alt="product.name" />
                <span v-if="product.badge" class="badge">{{ product.badge }}</span>
              </div>
            </div>

            <!-- 商品信息 -->
            <div class="product-info">
              <div class="category-tag">
                <span class="tag-icon">{{ product.categoryIcon || product.category_icon || '🎁' }}</span>
                <span>{{ product.categoryName || product.category_name }}</span>
              </div>
              <h1 class="product-name">{{ product.name }}</h1>
              <div class="product-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ product.price }}</span>
              </div>
              <p class="product-summary">{{ product.description }}</p>

              <div class="product-actions">
                <div class="quantity-selector">
                  <button class="qty-btn" @click="decreaseQty" :disabled="quantity <= 1">-</button>
                  <span class="qty-value">{{ quantity }}</span>
                  <button class="qty-btn" @click="increaseQty">+</button>
                </div>
                <button class="btn-add-cart" @click="addToCart">
                  <span>🛒</span> 加入购物车
                </button>
              </div>

              <!-- 快捷信息 -->
              <div class="quick-info">
                <div class="info-item">
                  <span class="info-icon">📦</span>
                  <span>库存充足</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">🚚</span>
                  <span>全国包邮</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">🛡️</span>
                  <span>正品保障</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 商品详情 -->
      <section class="product-specs">
        <div class="container">
          <div class="section-title">
            <h2>商品详情</h2>
          </div>
          <div class="specs-grid">
            <div class="spec-card" v-for="(spec, index) in productSpecs" :key="index">
              <div class="spec-header">
                <span class="spec-icon">{{ spec.icon }}</span>
                <h3>{{ spec.title }}</h3>
              </div>
              <p>{{ spec.content }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 匠心故事 -->
      <section class="craft-story">
        <div class="container">
          <div class="section-title">
            <h2>匠心故事</h2>
            <p class="section-subtitle">探寻非遗工艺背后的传承与坚守</p>
          </div>
          <div class="story-content">
            <div class="story-decoration left"></div>
            <div class="story-body">
              <h3>{{ craftsmanshipStory.title }}</h3>
              <div class="story-divider"></div>
              <p v-for="(paragraph, idx) in craftsmanshipStory.paragraphs" :key="idx">{{ paragraph }}</p>
            </div>
            <div class="story-decoration right"></div>
          </div>
        </div>
      </section>

      <!-- 相关推荐 -->
      <section v-if="relatedProducts.length > 0" class="related-products">
        <div class="container">
          <div class="section-title">
            <h2>相关推荐</h2>
            <p class="section-subtitle">同类别匠心好物</p>
          </div>
          <div class="related-grid">
            <router-link
              v-for="item in relatedProducts"
              :key="item.id"
              :to="`/product/${item.product_id || item.id}`"
              class="related-card card"
            >
              <div class="related-image">
                <img :src="item.image_url || item.image" :alt="item.name" loading="lazy" />
              </div>
              <div class="related-info">
                <span class="related-category">{{ item.category_name || item.categoryName }}</span>
                <h4>{{ item.name }}</h4>
                <span class="related-price">¥{{ item.price }}</span>
              </div>
            </router-link>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart.js'
import { getProduct, getRelatedProducts } from '../api/shop.js'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = ref(null)
const relatedProducts = ref([])
const loading = ref(true)
const error = ref(null)
const quantity = ref(1)

// 商品图片
const productImage = computed(() => {
  if (!product.value) return ''
  return product.value.image_url || product.value.image || product.value.cover_image || ''
})

// 商品详情规格（根据商品类别和名称生成）
const productSpecs = computed(() => {
  if (!product.value) return []
  return generateSpecs(product.value)
})

// 匠心故事
const craftsmanshipStory = computed(() => {
  if (!product.value) return { title: '', paragraphs: [] }
  return generateStory(product.value)
})

// 加载商品数据
const loadProduct = async () => {
  loading.value = true
  error.value = null
  const productId = route.params.productId

  try {
    const { data } = await getProduct(productId)
    if (data.product) {
      product.value = {
        id: data.product.id,
        categoryId: data.product.category_id,
        categoryName: data.product.category_name,
        categoryIcon: data.product.category_icon,
        name: data.product.name,
        description: data.product.description || '',
        price: data.product.price,
        image_url: data.product.image_url,
        badge: data.product.badge || ''
      }
    } else {
      error.value = '商品不存在'
    }
  } catch (err) {
    console.error('加载商品详情失败:', err)
    if (err.response && err.response.status === 404) {
      error.value = '商品不存在'
    } else {
      // 使用默认数据作为后备
      product.value = getDefaultProduct(productId)
    }
  } finally {
    loading.value = false
  }
}

// 加载相关推荐
const loadRelated = async () => {
  const productId = route.params.productId
  try {
    const { data } = await getRelatedProducts(productId)
    if (data.products && data.products.length > 0) {
      relatedProducts.value = data.products
    }
  } catch (err) {
    console.error('加载推荐商品失败:', err)
    // 静默失败，相关推荐不是关键功能
  }
}

// 默认商品数据（API 失败时的后备）
const getDefaultProduct = (productId) => {
  const defaultProducts = {
    1: { id: 1, categoryId: 'craft', categoryName: '传统工艺', categoryIcon: '🏺', name: '苏绣手工团扇', description: '苏州刺绣工艺，双面绣技法，绘有牡丹图案，精美绝伦', price: 168, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Suzhou%20embroidery%20fan%20with%20peony%20pattern%2C%20elegant%20handicraft&image_size=square', badge: '非遗精选' },
    2: { id: 2, categoryId: 'craft', categoryName: '传统工艺', categoryIcon: '🏺', name: '景德镇青花瓷茶杯', description: '正宗景德镇瓷器，手工绘制青花山水图案，釉色温润', price: 128, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jingdezhen%20blue%20and%20white%20porcelain%20tea%20cup%20with%20landscape%20painting%2C%20traditional%20Chinese%20style&image_size=square', badge: '热销' },
    3: { id: 3, categoryId: 'craft', categoryName: '传统工艺', categoryIcon: '🏺', name: '剪纸艺术装饰画', description: '陕西剪纸技艺，红色福字图案，喜庆吉祥', price: 68, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20paper%20cutting%20art%20decoration%2C%20red%20color%2C%20Fu%20character%20pattern&image_size=square', badge: '' },
    4: { id: 4, categoryId: 'craft', categoryName: '传统工艺', categoryIcon: '🏺', name: '景泰蓝花瓶', description: '北京景泰蓝工艺，铜胎掐丝珐琅，色彩绚丽', price: 398, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20cloisonne%20vase%2C%20jingtailan%20craftsmanship%2C%20colorful%20enamel%20decoration&image_size=square', badge: '非遗臻品' },
    5: { id: 5, categoryId: 'textile', categoryName: '传统服饰', categoryIcon: '🧵', name: '蜀锦丝巾', description: '四川成都蜀锦织造技艺，传统纹样，色泽艳丽', price: 268, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Shu%20brocade%20silk%20scarf%2C%20ancient%20pattern%2C%20elegant%20design&image_size=square', badge: '' },
    6: { id: 6, categoryId: 'textile', categoryName: '传统服饰', categoryIcon: '🧵', name: '汉服配饰套装', description: '传统汉服配饰，发簪、玉佩、香囊组合套装', price: 198, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Hanfu%20accessories%2C%20hairpin%2C%20jade%20pendant%2C%20sachet%2C%20elegant%20style&image_size=square', badge: '' },
    7: { id: 7, categoryId: 'food', categoryName: '传统美食', categoryIcon: '🍵', name: '西湖龙井礼盒', description: '正宗西湖龙井茶，明前特级，清香四溢', price: 388, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20West%20Lake%20Longjing%20green%20tea%20gift%20box%2C%20premium%20quality%2C%20elegant%20packaging&image_size=square', badge: '特产' },
    8: { id: 8, categoryId: 'food', categoryName: '传统美食', categoryIcon: '🍵', name: '月饼礼盒', description: '传统广式月饼，多种口味组合，精美包装', price: 168, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20mooncake%20gift%20box%2C%20Cantonese%20style%2C%20elegant%20packaging&image_size=square', badge: '' },
    9: { id: 9, categoryId: 'music', categoryName: '传统乐器', categoryIcon: '🎵', name: '古琴书签套装', description: '古琴造型书签，金属材质，精美蚀刻图案', price: 48, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20guqin%20style%20bookmark%20set%2C%20metal%20material%2C%20elegant%20design&image_size=square', badge: '' },
    10: { id: 10, categoryId: 'craft', categoryName: '传统工艺', categoryIcon: '🏺', name: '紫砂茶壶', description: '宜兴紫砂工艺，手工制作，茶香四溢', price: 598, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yixing%20purple%20clay%20teapot%2C%20Chinese%20traditional%20zisha%20craftsmanship%2C%20elegant%20design&image_size=square', badge: '非遗臻品' },
    11: { id: 11, categoryId: 'craft', categoryName: '传统工艺', categoryIcon: '🏺', name: '东阳木雕摆件', description: '浙江东阳木雕，精雕细琢，栩栩如生', price: 298, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20Dongyang%20wood%20carving%20ornament%2C%20intricate%20detail%2C%20traditional%20craftsmanship&image_size=square', badge: '' },
    12: { id: 12, categoryId: 'art', categoryName: '传统书画', categoryIcon: '🖼️', name: '书法作品', description: '名家手书，书法真迹，可定制内容', price: 888, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20calligraphy%20artwork%2C%20elegant%20brush%20writing%2C%20artistic%20style&image_size=square', badge: '' }
  }
  return defaultProducts[productId] || null
}

// 生成商品规格详情
const generateSpecs = (product) => {
  const name = product.name || ''
  const category = product.categoryId || product.category_id || ''

  const specsMap = {
    craft: [
      { icon: '🎨', title: '工艺技法', content: '采用传统手工技艺，历经数代匠人传承与改良，每一件作品都凝聚了匠人的心血与智慧。从选材到成品，严格遵循古法工序，确保品质纯正。' },
      { icon: '📐', title: '规格尺寸', content: '根据传统形制精心设计，尺寸比例考究，既保留了传统器物的经典造型，又兼顾了现代生活的实用需求。' },
      { icon: '✨', title: '材质用料', content: '精选优质天然材料，经严格筛选和特殊处理，确保材质的纯度与耐久性。所有用料均符合国家环保标准，安全无害。' }
    ],
    textile: [
      { icon: '🎨', title: '织造工艺', content: '采用传统织造技艺，图案纹样源于古代经典，由经验丰富的织工精心织就。每一寸布料都蕴含着深厚的文化底蕴和精湛的织造技艺。' },
      { icon: '📐', title: '规格尺寸', content: '根据传统服饰形制设计，版型考究，尺寸精准。兼顾美观与舒适，适合日常穿着与重要场合佩戴。' },
      { icon: '✨', title: '面料材质', content: '选用优质天然面料，如桑蚕丝、纯棉、麻等，手感柔软细腻，透气性好。染色采用天然植物染料，色泽自然，环保健康。' }
    ],
    food: [
      { icon: '🎨', title: '制作工艺', content: '遵循传统配方和手工制作工艺，从原料挑选到成品包装，每个环节都严格把控。保留食材最本真的味道，传承经典美食文化。' },
      { icon: '📐', title: '规格包装', content: '精美礼盒包装，内置独立小包装，方便携带与分享。包装设计融入传统元素，兼具美观与实用，是馈赠亲友的佳品。' },
      { icon: '✨', title: '食材来源', content: '精选优质原产地食材，确保新鲜与纯正。所有食材均经过严格质检，无添加防腐剂和人工色素，让您吃得放心。' }
    ],
    music: [
      { icon: '🎨', title: '制作工艺', content: '以传统乐器为灵感，结合现代金属蚀刻工艺，将传统音乐元素融入日常用品之中。每一件作品都经过精心设计与打磨，细节之处见匠心。' },
      { icon: '📐', title: '规格尺寸', content: '尺寸适中，便于携带与收藏。设计兼顾实用性与观赏性，既可作为日常使用，也可作为文化展示品。' },
      { icon: '✨', title: '材质用料', content: '采用优质金属材质，表面经特殊处理，防锈耐磨。图案清晰精美，色泽持久，经得起时间的考验。' }
    ],
    art: [
      { icon: '🎨', title: '创作技法', content: '由资深艺术家精心创作，融合传统书画技法与现代审美理念。笔墨之间，尽显中华文化的博大精深与独特魅力。' },
      { icon: '📐', title: '规格尺寸', content: '根据传统书画规格精心装裱，尺寸考究。适合悬挂于书房、客厅等场所，为空间增添文化气息与艺术韵味。' },
      { icon: '✨', title: '材质用料', content: '选用优质宣纸或绢本，搭配传统墨汁与天然矿物颜料。装裱材料考究，确保作品长久保存，历久弥新。' }
    ]
  }

  return specsMap[category] || specsMap['craft']
}

// 生成匠心故事
const generateStory = (product) => {
  const name = product.name || ''
  const categoryId = product.categoryId || product.category_id || ''

  const stories = {
    craft: {
      title: '千年技艺，匠心传承',
      paragraphs: [
        '在中国广袤的土地上，传统手工艺如同璀璨的星辰，散落在历史的长河中。' + (name || '这件作品') + '，正是这璀璨星河中的一颗明珠，承载着千年技艺的智慧与温度。',
        '每一件传统工艺品的诞生，都凝聚着匠人数十年如一日的坚守。从选材的严苛，到制作的精细，再到成品的打磨，每一个环节都倾注了匠人的全部心血。他们用双手触摸材料的纹理，用心感受工艺的韵律，将无形的文化融入有形的器物之中。',
        '这些技艺大多是国家级或省级非物质文化遗产，代代相传，口传心授。在现代工业化浪潮的冲击下，坚守传统手工艺的匠人越来越少，但正是他们的坚持，让这些古老的技艺得以延续，让中华文化的根脉得以传承。',
        '我们深知，每一件非遗手工艺品背后，都有一个关于坚守与传承的故事。选择' + (name || '它') + '，不仅是选择了一件精美的器物，更是选择了一份对传统文化的敬意与守护。'
      ]
    },
    textile: {
      title: '锦绣华章，衣冠传承',
      paragraphs: [
        '中国传统服饰文化源远流长，' + (name || '这件作品') + '凝聚了千百年来华夏衣冠的智慧与美学。从丝绸的诞生到织锦的繁荣，中国纺织技艺始终走在世界前列。',
        '传统服饰的织造是一门极为讲究的技艺。从养蚕缫丝到织布染色，从图案设计到裁剪缝制，每一道工序都需要匠人倾注极大的耐心与专注。那些精美的纹样，或取自自然花鸟，或源于神话传说，无不蕴含着丰富的文化内涵。',
        '在快时尚盛行的今天，传统服饰的制作工艺面临着严峻的挑战。然而，仍有一批匠人坚守着这门古老的手艺，用一针一线诠释着对传统文化的热爱与执着。他们相信，真正的美经得起时间的考验。',
        '穿上' + (name || '它') + '，感受的不仅是面料的柔软与舒适，更是千年文化的厚重与温暖。让我们一起，守护这份来之不易的文化遗产。'
      ]
    },
    food: {
      title: '舌尖非遗，百年滋味',
      paragraphs: [
        '中华美食文化博大精深，' + (name || '这份美食') + '承载着一方水土的独特风味与记忆。传统美食的制作技艺，往往凝聚了几代人的心血与智慧，是真正的"舌尖上的非遗"。',
        '传统美食的魅力在于其对原料的讲究和对工艺的坚守。从选材到加工，从调味到烹饪，每一个环节都有着严格的标准和独特的技法。这些技艺往往是家族或师徒之间口传心授，不轻易外传。',
        '在工业化食品泛滥的今天，手工制作的传统美食显得尤为珍贵。它们不仅保留了食材最本真的味道，更承载着人们对家乡、对童年的美好回忆。每一口，都是满满的幸福感。',
        '品尝' + (name || '它') + '，品味的不只是美味，更是一段悠久的饮食文化史。让我们共同守护这份舌尖上的文化遗产，让传统美食的香气永远飘荡。'
      ]
    },
    music: {
      title: '弦歌不辍，雅韵流芳',
      paragraphs: [
        '中国传统音乐文化是中华文明的重要组成部分，' + (name || '这件作品') + '以传统乐器为灵感，将音乐之美融入日常生活之中，让千年雅韵在指尖流淌。',
        '古琴、古筝、琵琶、二胡……每一种传统乐器都有着独特的音色和深厚的文化内涵。它们不仅是演奏音乐的器具，更是文人雅士寄托情怀的载体。琴棋书画，琴居首位，可见其在中国文化中的地位。',
        '传统乐器的制作工艺同样是非遗瑰宝。选材、开料、雕刻、上漆、调音，每一道工序都需要匠人具备极高的技艺和审美。一把好琴，往往需要数年甚至数十年的精心打磨。',
        '拥有' + (name || '它') + '，感受传统音乐文化的魅力，让千年雅韵在现代生活中继续绽放光彩。'
      ]
    },
    art: {
      title: '笔墨丹青，气韵生动',
      paragraphs: [
        '中国书画艺术是中华文化的瑰宝，' + (name || '这件作品') + '承载着千年笔墨传统的精髓与灵魂。从甲骨文到篆隶楷行草，从工笔到写意，中国书画艺术源远流长，博大精深。',
        '书画创作讲究"气韵生动"，追求的是笔墨之外的意境与神韵。一位优秀的书画家，不仅需要精湛的技法，更需要深厚的文化修养和丰富的人生阅历。每一笔、每一画，都是内心世界的真实写照。',
        '在数字化时代，传统书画艺术面临着传承与发展的挑战。然而，越来越多的年轻人开始重新认识和热爱这门古老的艺术，用新的视角和方式诠释传统的魅力。',
        '收藏' + (name || '它') + '，不仅是拥有一件艺术品，更是与千年文化传统的一次深情对话。让笔墨丹青之美，永远绽放在我们的生活之中。'
      ]
    }
  }

  return stories[categoryId] || stories['craft']
}

// 添加到购物车
const addToCart = () => {
  if (!product.value) return
  for (let i = 0; i < quantity.value; i++) {
    cartStore.addToCart({
      id: product.value.id,
      name: product.value.name,
      price: product.value.price,
      image: productImage.value,
      image_url: productImage.value
    })
  }
  // 提示
  alert(`已将 ${quantity.value} 件「${product.value.name}」加入购物车`)
}

// 数量调整
const increaseQty = () => {
  quantity.value++
}

const decreaseQty = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// 监听路由参数变化
watch(() => route.params.productId, () => {
  if (route.params.productId) {
    quantity.value = 1
    loadProduct()
    loadRelated()
  }
})

onMounted(() => {
  loadProduct()
  loadRelated()
})
</script>

<style scoped>
/* ===== 面包屑 ===== */
.breadcrumb {
  background: var(--bg-light);
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color);
}

.breadcrumb .container {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-light);
}

.breadcrumb a {
  color: var(--text-light);
  text-decoration: none;
  transition: color 0.3s ease;
}

.breadcrumb a:hover {
  color: var(--primary-color);
}

.breadcrumb .separator {
  color: var(--border-color);
}

.breadcrumb .current {
  color: var(--primary-color);
  font-weight: 500;
}

/* ===== 加载状态 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 16px;
  color: var(--text-light);
}

/* ===== 错误状态 ===== */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  gap: 15px;
  padding: 40px 20px;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 10px;
}

.error-state h2 {
  font-size: 24px;
  color: var(--text-dark);
}

.error-state p {
  font-size: 16px;
  color: var(--text-light);
  margin-bottom: 10px;
}

/* ===== 商品主区域 ===== */
.product-hero {
  padding: 60px 0;
  background: var(--bg-white);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: start;
}

/* 商品大图 */
.product-gallery {
  position: sticky;
  top: 100px;
}

.main-image {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.main-image img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.main-image:hover img {
  transform: scale(1.05);
}

.badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: linear-gradient(135deg, #E74C3C, #C0392B);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

/* 商品信息 */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--accent-color);
  background: rgba(201, 169, 110, 0.1);
  padding: 6px 14px;
  border-radius: 20px;
  width: fit-content;
}

.tag-icon {
  font-size: 16px;
}

.product-name {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1.3;
  letter-spacing: 1px;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-symbol {
  font-size: 20px;
  color: #E74C3C;
  font-weight: 500;
}

.price-value {
  font-size: 40px;
  font-weight: 700;
  color: #E74C3C;
}

.product-summary {
  font-size: 16px;
  color: var(--text-light);
  line-height: 1.8;
  padding: 20px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

/* 购买操作 */
.product-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: 30px;
  overflow: hidden;
}

.qty-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg-light);
  color: var(--text-dark);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.qty-btn:hover:not(:disabled) {
  background: var(--accent-color);
  color: white;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-value {
  width: 50px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.btn-add-cart {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 30px;
  background: linear-gradient(135deg, var(--primary-color), #8B1A1A);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(178, 34, 34, 0.3);
}

.btn-add-cart:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(178, 34, 34, 0.4);
}

.btn-add-cart:active {
  transform: translateY(0);
}

/* 快捷信息 */
.quick-info {
  display: flex;
  gap: 30px;
  padding-top: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-light);
}

.info-icon {
  font-size: 16px;
}

/* ===== 商品详情规格 ===== */
.product-specs {
  padding: 80px 0;
  background: var(--bg-light);
}

.section-subtitle {
  font-size: 16px;
  color: var(--text-light);
  margin-top: 10px;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.spec-card {
  background: var(--bg-white);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.spec-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--accent-color);
}

.spec-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.spec-icon {
  font-size: 28px;
}

.spec-header h3 {
  font-size: 18px;
  color: var(--text-dark);
  font-weight: 600;
}

.spec-card p {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.8;
}

/* ===== 匠心故事 ===== */
.craft-story {
  padding: 80px 0;
  background: linear-gradient(180deg, var(--bg-white), #FFF8F0, var(--bg-white));
  position: relative;
  overflow: hidden;
}

.story-content {
  display: flex;
  align-items: flex-start;
  gap: 30px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.story-decoration {
  flex-shrink: 0;
  width: 60px;
  height: 120px;
  opacity: 0.15;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.story-decoration.left {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 120'%3E%3Cpath d='M30 10 L50 30 L50 50 L30 70 L10 50 L10 30 Z' fill='none' stroke='%23B22222' stroke-width='2'/%3E%3Ccircle cx='30' cy='60' r='8' fill='%23DAA520'/%3E%3C/svg%3E");
}

.story-decoration.right {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 120'%3E%3Cpath d='M30 10 L50 30 L50 50 L30 70 L10 50 L10 30 Z' fill='none' stroke='%23B22222' stroke-width='2'/%3E%3Ccircle cx='30' cy='60' r='8' fill='%23DAA520'/%3E%3C/svg%3E");
}

.story-body {
  flex: 1;
  background: var(--bg-white);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
  position: relative;
}

.story-body::before {
  content: '\201C';
  position: absolute;
  top: -20px;
  left: 20px;
  font-size: 80px;
  color: var(--accent-color);
  opacity: 0.2;
  font-family: Georgia, serif;
  line-height: 1;
}

.story-body h3 {
  font-size: 24px;
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 20px;
  font-weight: 700;
  letter-spacing: 2px;
}

.story-divider {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  margin: 0 auto 25px;
  border-radius: 2px;
}

.story-body p {
  font-size: 15px;
  color: var(--text-dark);
  line-height: 2;
  text-indent: 2em;
  margin-bottom: 12px;
}

.story-body p:last-child {
  margin-bottom: 0;
}

/* ===== 相关推荐 ===== */
.related-products {
  padding: 80px 0;
  background: var(--bg-light);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
}

.related-card {
  text-decoration: none;
  overflow: hidden;
  background: var(--bg-white);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.related-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
}

.related-image {
  overflow: hidden;
}

.related-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.related-card:hover .related-image img {
  transform: scale(1.08);
}

.related-info {
  padding: 15px;
}

.related-category {
  display: inline-block;
  font-size: 11px;
  color: var(--accent-color);
  background: rgba(201, 169, 110, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 8px;
}

.related-info h4 {
  font-size: 15px;
  color: var(--text-dark);
  margin-bottom: 8px;
  font-weight: 600;
  line-height: 1.4;
}

.related-price {
  font-size: 18px;
  font-weight: 700;
  color: #E74C3C;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .product-gallery {
    position: static;
  }

  .product-name {
    font-size: 24px;
  }

  .price-value {
    font-size: 32px;
  }

  .product-actions {
    flex-direction: column;
  }

  .quantity-selector {
    width: 100%;
    justify-content: center;
  }

  .btn-add-cart {
    width: 100%;
  }

  .quick-info {
    flex-wrap: wrap;
    gap: 15px;
  }

  .specs-grid {
    grid-template-columns: 1fr;
  }

  .story-content {
    flex-direction: column;
  }

  .story-decoration {
    display: none;
  }

  .story-body {
    padding: 25px;
  }

  .story-body h3 {
    font-size: 20px;
  }

  .story-body p {
    font-size: 14px;
    text-indent: 1.5em;
  }

  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .product-hero {
    padding: 30px 0;
  }

  .product-name {
    font-size: 20px;
  }

  .price-value {
    font-size: 28px;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }

  .product-specs,
  .craft-story,
  .related-products {
    padding: 50px 0;
  }
}
</style>
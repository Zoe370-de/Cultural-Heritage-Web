<template>
  <div class="store">
    <section class="page-header">
      <div class="container">
        <h1>文创商店</h1>
        <p>精选非遗文化创意产品 · 传承千年之美</p>
      </div>
    </section>

    <section class="store-categories">
      <div class="container">
        <div class="category-tabs">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="cat-btn"
            :class="{ 'active': activeCategory === cat.id }"
            @click="handleCategoryChange(cat.id)"
          >
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-name">{{ cat.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="store-products">
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <SkeletonLoader type="grid" />
        </div>
        
        <!-- 错误提示 -->
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button class="btn btn-primary" @click="loadProducts()">重新加载</button>
        </div>
        
        <!-- 商品列表 -->
        <div v-else class="products-grid">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-card card"
          >
            <div class="product-image" @click="goToProduct(product)">
              <img :src="product.image" :alt="product.name" loading="lazy">
              <span v-if="product.badge" class="product-badge">{{ product.badge }}</span>
            </div>
            <div class="product-info">
              <div class="product-category-tag">{{ product.categoryName }}</div>
              <h3 class="product-name-clickable" @click="goToProduct(product)">{{ product.name }}</h3>
              <p>{{ product.description }}</p>
              <div class="product-footer">
                <div class="product-price">
                  <span class="price-symbol">¥</span>
                  <span class="price-value">{{ product.price }}</span>
                </div>
                <button class="btn-cart" @click="addToCart(product)">
                  <span class="cart-icon">🛒</span> 加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!loading && !error && filteredProducts.length === 0" class="empty-state">
          <p>暂无商品</p>
        </div>
      </div>
    </section>

    <section class="store-featured">
      <div class="container">
        <div class="section-title">
          <h2>本周推荐</h2>
        </div>
        <div class="featured-grid">
          <div class="featured-card" v-for="item in featuredItems" :key="item.id">
            <div class="featured-image">
              <img :src="item.image" :alt="item.title" loading="lazy">
            </div>
            <div class="featured-overlay">
              <h3>{{ item.title }}</h3>
              <p>{{ item.subtitle }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="store-cart">
      <div class="container">
        <div class="section-title">
          <h2>购物车 <span class="cart-count">({{ cartStore.items.length }})</span></h2>
        </div>
        <div v-if="cartStore.items.length === 0" class="cart-empty">
          <div class="empty-icon">🛒</div>
          <p>购物车是空的，快去挑选喜欢的文创产品吧！</p>
        </div>
        <div v-else class="cart-list">
          <div v-for="(item, index) in cartStore.items" :key="index" class="cart-item">
            <div class="cart-item-image">
              <img :src="item.image" :alt="item.name">
            </div>
            <div class="cart-item-info">
              <h4>{{ item.name }}</h4>
              <span class="cart-item-price">¥{{ item.price }}</span>
            </div>
            <button class="cart-remove" @click="removeFromCart(index)">✕</button>
          </div>
          <div class="cart-total">
            <span>合计：</span>
            <span class="total-price">¥{{ cartTotal }}</span>
          </div>
          <button class="btn btn-primary cart-checkout" @click="checkout">立即结算</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart.js'
import { getProducts, getCategories } from '../api/shop.js'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const router = useRouter()
const cartStore = useCartStore()
const activeCategory = ref('all')
const cart = ref([])

// 数据状态
const categories = ref([
  { id: 'all', name: '全部', icon: '🎁' },
  { id: 'craft', name: '传统工艺', icon: '🏺' },
  { id: 'textile', name: '传统服饰', icon: '🧵' },
  { id: 'food', name: '传统美食', icon: '🍵' },
  { id: 'music', name: '传统乐器', icon: '🎵' },
  { id: 'art', name: '传统书画', icon: '🖼️' }
])
const products = ref([])
const featuredItems = ref([])
const loading = ref(true)
const error = ref(null)

// 加载商品分类
const loadCategories = async () => {
  try {
    const { data } = await getCategories()
    if (data.categories && data.categories.length > 0) {
      // 在全部选项后添加后端返回的分类
      const backendCategories = data.categories.map(cat => ({
        id: cat.category_id || cat.id,
        name: cat.name,
        icon: cat.icon || ''
      }))
      categories.value = [
        { id: 'all', name: '全部', icon: '🎁' },
        ...backendCategories
      ]
    }
  } catch (err) {
    console.error('加载分类失败:', err)
    // 使用默认分类作为后备
  }
}

// 加载商品数据
const loadProducts = async (category = 'all') => {
  loading.value = true
  error.value = null
  try {
    const { data } = await getProducts(category === 'all' ? undefined : category)
    if (data.products && data.products.length > 0) {
      products.value = data.products.map(product => ({
        id: product.product_id || product.id,
        category: product.category || product.category_id,
        categoryName: product.categoryName || product.category_name || '',
        name: product.name,
        description: product.description || '',
        price: product.price,
        image: product.image_url || product.image || product.cover_image || '',
        badge: product.badge || product.tag || ''
      }))
      
      const badgeProducts = products.value.filter(p => p.badge)
      featuredItems.value = badgeProducts.length >= 3 
        ? badgeProducts.slice(0, 3).map(p => ({
            id: p.id,
            title: p.name,
            subtitle: p.description,
            image: p.image
          }))
        : products.value.slice(0, 3).map(p => ({
            id: p.id,
            title: p.name,
            subtitle: p.description,
            image: p.image
          }))
    } else {
      products.value = getDefaultProducts()
      featuredItems.value = products.value.slice(0, 3).map(p => ({
        id: p.id,
        title: p.name,
        subtitle: p.description,
        image: p.image
      }))
    }
  } catch (err) {
    console.error('加载商品失败:', err)
    products.value = getDefaultProducts()
    featuredItems.value = products.value.slice(0, 3).map(p => ({
      id: p.id,
      title: p.name,
      subtitle: p.description,
      image: p.image
    }))
  } finally {
    loading.value = false
  }
}

const getDefaultProducts = () => {
  return [
    {
      id: 1,
      category: 'craft',
      categoryName: '传统工艺',
      name: '苏绣手工团扇',
      description: '苏州刺绣工艺，双面绣技法，绘有牡丹图案，精美绝伦',
      price: 168,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Suzhou%20embroidery%20fan%20with%20peony%20pattern%2C%20elegant%20handicraft&image_size=square',
      badge: '非遗精选'
    },
    {
      id: 2,
      category: 'craft',
      categoryName: '传统工艺',
      name: '景德镇青花瓷茶杯',
      description: '正宗景德镇瓷器，手工绘制青花山水图案，釉色温润',
      price: 128,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jingdezhen%20blue%20and%20white%20porcelain%20tea%20cup%20with%20landscape%20painting%2C%20traditional%20Chinese%20style&image_size=square',
      badge: '热销'
    },
    {
      id: 3,
      category: 'craft',
      categoryName: '传统工艺',
      name: '剪纸艺术装饰画',
      description: '陕西剪纸技艺，红色福字图案，喜庆吉祥',
      price: 68,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20paper%20cutting%20art%20decoration%2C%20red%20color%2C%20Fu%20character%20pattern&image_size=square',
      badge: ''
    },
    {
      id: 4,
      category: 'craft',
      categoryName: '传统工艺',
      name: '景泰蓝花瓶',
      description: '北京景泰蓝工艺，铜胎掐丝珐琅，色彩绚丽',
      price: 398,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20cloisonne%20vase%2C%20jingtailan%20craftsmanship%2C%20colorful%20enamel%20decoration&image_size=square',
      badge: '非遗臻品'
    },
    {
      id: 5,
      category: 'textile',
      categoryName: '传统服饰',
      name: '蜀锦丝巾',
      description: '四川成都蜀锦织造技艺，传统纹样，色泽艳丽',
      price: 268,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Shu%20brocade%20silk%20scarf%2C%20ancient%20pattern%2C%20elegant%20design&image_size=square',
      badge: ''
    },
    {
      id: 6,
      category: 'textile',
      categoryName: '传统服饰',
      name: '汉服配饰套装',
      description: '传统汉服配饰，发簪、玉佩、香囊组合套装',
      price: 198,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Hanfu%20accessories%2C%20hairpin%2C%20jade%20pendant%2C%20sachet%2C%20elegant%20style&image_size=square',
      badge: ''
    },
    {
      id: 7,
      category: 'food',
      categoryName: '传统美食',
      name: '西湖龙井礼盒',
      description: '正宗西湖龙井茶，明前特级，清香四溢',
      price: 388,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20West%20Lake%20Longjing%20green%20tea%20gift%20box%2C%20premium%20quality%2C%20elegant%20packaging&image_size=square',
      badge: '特产'
    },
    {
      id: 8,
      category: 'food',
      categoryName: '传统美食',
      name: '月饼礼盒',
      description: '传统广式月饼，多种口味组合，精美包装',
      price: 168,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20mooncake%20gift%20box%2C%20Cantonese%20style%2C%20elegant%20packaging&image_size=square',
      badge: ''
    },
    {
      id: 9,
      category: 'music',
      categoryName: '传统乐器',
      name: '古琴书签套装',
      description: '古琴造型书签，金属材质，精美蚀刻图案',
      price: 48,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20guqin%20style%20bookmark%20set%2C%20metal%20material%2C%20elegant%20design&image_size=square',
      badge: ''
    },
    {
      id: 10,
      category: 'craft',
      categoryName: '传统工艺',
      name: '紫砂茶壶',
      description: '宜兴紫砂工艺，手工制作，茶香四溢',
      price: 598,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yixing%20purple%20clay%20teapot%2C%20Chinese%20traditional%20zisha%20craftsmanship%2C%20elegant%20design&image_size=square',
      badge: '非遗臻品'
    },
    {
      id: 11,
      category: 'craft',
      categoryName: '传统工艺',
      name: '东阳木雕摆件',
      description: '浙江东阳木雕，精雕细琢，栩栩如生',
      price: 298,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20Dongyang%20wood%20carving%20ornament%2C%20intricate%20detail%2C%20traditional%20craftsmanship&image_size=square',
      badge: ''
    },
    {
      id: 12,
      category: 'art',
      categoryName: '传统书画',
      name: '书法作品',
      description: '名家手书，书法真迹，可定制内容',
      price: 888,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20calligraphy%20artwork%2C%20elegant%20brush%20writing%2C%20artistic%20style&image_size=square',
      badge: ''
    }
  ]
}

// 筛选商品
const filteredProducts = computed(() => {
  if (activeCategory.value === 'all') return products.value
  return products.value.filter(p => p.category === activeCategory.value)
})

// 购物车总价
const cartTotal = computed(() => {
  return cartStore.totalPrice
})

// 添加到购物车
const addToCart = (product) => {
  cartStore.addToCart(product)
}

// 从购物车移除
const removeFromCart = (index) => {
  cartStore.removeFromCart(index)
}

// 结算
const checkout = () => {
  if (cartStore.items.length === 0) {
    alert('购物车是空的')
    return
  }
  router.push('/checkout')
}

// 跳转到商品详情页
const goToProduct = (product) => {
  router.push(`/product/${product.id}`)
}

// 分类切换时重新加载商品
const handleCategoryChange = async (categoryId) => {
  activeCategory.value = categoryId
  await loadProducts(categoryId)
}

// 组件挂载时加载数据
onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadProducts()
  ])
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

.store-categories {
  padding: 30px 0;
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 70px;
  z-index: 100;
}

.category-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.cat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--bg-light);
  border: 2px solid transparent;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
  color: var(--text-dark);
}

.cat-btn:hover {
  border-color: var(--accent-color);
  background: rgba(212, 175, 55, 0.05);
}

.cat-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
}

.cat-icon {
  font-size: 18px;
}

.store-products {
  padding: 60px 0;
  background: var(--bg-light);
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 80px 20px;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 1.5s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 16px;
  color: var(--text-light);
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-white);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.error-state p {
  font-size: 16px;
  color: #E74C3C;
  margin-bottom: 20px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
}

.product-card {
  overflow: hidden;
  background: var(--bg-white);
  border-radius: 20px 20px 50px 20px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.product-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--primary-color));
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.product-card:hover {
  border-radius: 50px 20px 20px 50px;
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 50px rgba(74, 144, 164, 0.2);
}

.product-card:hover::after {
  transform: scaleX(1);
}

.product-image {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.product-image img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.08);
}

.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #E74C3C, #C0392B);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.product-info {
  padding: 20px;
}

.product-category-tag {
  display: inline-block;
  font-size: 12px;
  color: var(--accent-color);
  background: rgba(212, 175, 55, 0.1);
  padding: 3px 10px;
  border-radius: 12px;
  margin-bottom: 10px;
}

.product-info h3 {
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.product-name-clickable {
  cursor: pointer;
  transition: color 0.3s ease;
}

.product-name-clickable:hover {
  color: var(--primary-color);
}

.product-info p {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  color: #E74C3C;
}

.price-symbol {
  font-size: 14px;
  font-weight: 500;
}

.price-value {
  font-size: 24px;
  font-weight: 700;
}

.btn-cart {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--accent-color), #C8963E);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cart:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

.cart-icon {
  font-size: 16px;
}

.store-featured {
  padding: 60px 0;
  background: var(--bg-white);
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.featured-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.featured-image img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.featured-card:hover .featured-image img {
  transform: scale(1.08);
}

.featured-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
}

.featured-overlay h3 {
  font-size: 22px;
  margin-bottom: 5px;
}

.featured-overlay p {
  font-size: 14px;
  opacity: 0.9;
}

.store-cart {
  padding: 60px 0;
  background: var(--bg-light);
}

.cart-count {
  font-size: 16px;
  color: var(--text-light);
  font-weight: normal;
}

.cart-empty {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-white);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.cart-empty p {
  font-size: 16px;
  color: var(--text-light);
}

.cart-list {
  max-width: 700px;
  margin: 0 auto;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--bg-white);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.cart-item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-info {
  flex: 1;
}

.cart-item-info h4 {
  font-size: 16px;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.cart-item-price {
  color: #E74C3C;
  font-weight: 600;
}

.cart-remove {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.cart-remove:hover {
  background: #E74C3C;
  color: white;
}

.cart-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 20px 0;
  font-size: 18px;
  color: var(--text-dark);
}

.total-price {
  font-size: 28px;
  font-weight: 700;
  color: #E74C3C;
}

.cart-checkout {
  width: 100%;
  padding: 15px;
  font-size: 18px;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 32px;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }

  .product-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .btn-cart {
    width: 100%;
    justify-content: center;
  }

  .cart-item {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 24px;
  }

  .category-tabs {
    gap: 8px;
  }

  .cat-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .product-card {
    border-radius: 12px;
  }

  .product-info h3 {
    font-size: 16px;
  }

  .cart-item-image {
    width: 60px;
    height: 60px;
  }
}
</style>

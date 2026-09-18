<template>
  <div class="orders-page">
    <section class="page-header">
      <div class="container">
        <h1>我的订单</h1>
        <p>查看您的购物记录</p>
      </div>
    </section>

    <section class="orders-content">
      <div class="container">
        <div class="filter-tabs">
          <button 
            v-for="tab in filterTabs" 
            :key="tab.value" 
            class="filter-tab"
            :class="{ active: currentFilter === tab.value }"
            :disabled="loading"
            @click="switchFilter(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="loading" class="loading-text">加载中...</div>

        <div v-else-if="orders.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>暂无订单记录</p>
          <button class="btn btn-primary" @click="goToStore">去购物</button>
        </div>

        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.ID || order.order_no" class="order-card card">
            <div class="order-header">
              <div class="order-info">
                <span class="order-no">订单号：{{ order.order_no }}</span>
                <span class="order-date">{{ formatDate(order.created_at) }}</span>
              </div>
              <span class="status-badge" :class="getOrderStatusClass(order.status)">
                {{ order.status }}
              </span>
            </div>

            <div class="order-items">
              <div v-for="item in getOrderItems(order)" :key="item.id || item.product_name" class="item-card">
                <img :src="item.image" :alt="item.product_name" class="item-image" />
                <div class="item-info">
                  <h4 class="item-name">{{ item.product_name || item.name }}</h4>
                  <p class="item-spec">规格：{{ item.spec || '默认规格' }}</p>
                  <div class="item-bottom">
                    <span class="item-price">¥{{ item.price.toFixed(2) }}</span>
                    <span class="item-quantity">x{{ item.quantity }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="order-footer">
              <span class="order-total">
                共 {{ getOrderItemCount(order) }} 件商品，合计：
                <span class="total-price">¥{{ Number(order.total_amount || 0).toFixed(2) }}</span>
              </span>
              <div class="order-actions">
                <button v-if="order.status === '待付款'" class="action-btn primary" @click="goToPayment(order.order_no)">
                  去支付
                </button>
                <button v-else-if="order.status === '已付款'" class="action-btn" @click="contactSeller">
                  联系卖家
                </button>
                <button v-else-if="order.status === '已发货'" class="action-btn primary" @click="confirmReceipt(order)">
                  确认收货
                </button>
                <button class="action-btn outline" @click="viewDetail(order.order_no)">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">上一页</button>
          <button v-for="page in pageNumbers" :key="page" class="page-btn" :class="{ active: page === currentPage }" @click="changePage(page)">{{ page }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">下一页</button>
        </div>
      </div>
    </section>

    <div v-if="showDetail" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-card order-detail">
        <div class="modal-header">
          <h3>订单详情</h3>
          <button class="modal-close" @click="closeDetail">✕</button>
        </div>
        <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
          <div v-if="detailLoading" class="loading-text">加载中...</div>
          <div v-else-if="selectedOrder" class="order-detail-content">
            <div class="detail-section">
              <h4>基本信息</h4>
              <p><span>订单号：</span>{{ selectedOrder.order.order_no }}</p>
              <p><span>状态：</span><span class="status-badge" :class="getOrderStatusClass(selectedOrder.order.status)">{{ selectedOrder.order.status }}</span></p>
              <p><span>创建时间：</span>{{ formatDate(selectedOrder.order.created_at) }}</p>
            </div>
            <div class="detail-section">
              <h4>收货信息</h4>
              <p><span>收货人：</span>{{ selectedOrder.order.receiver }}</p>
              <p><span>联系电话：</span>{{ selectedOrder.order.phone }}</p>
              <p><span>收货地址：</span>{{ selectedOrder.order.province }}{{ selectedOrder.order.city }}{{ selectedOrder.order.district }}{{ selectedOrder.order.address }}</p>
            </div>
            <div class="detail-section">
              <h4>商品清单</h4>
              <div class="items-list">
                <div v-for="item in selectedOrder.items" :key="item.id || item.product_name" class="item-row">
                  <span>{{ item.product_name || item.name }}</span>
                  <span>x{{ item.quantity }}</span>
                  <span>¥{{ Number(item.subtotal || item.price * item.quantity || 0).toFixed(2) }}</span>
                </div>
              </div>
              <div class="total-row">
                <span>合计：</span>
                <span class="total-amount">¥{{ Number(selectedOrder.order.total_amount || 0).toFixed(2) }}</span>
              </div>
            </div>
            <div v-if="selectedOrder.order.remark" class="detail-section">
              <h4>备注</h4>
              <p>{{ selectedOrder.order.remark }}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeDetail">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '待付款', value: 'pending' },
  { label: '已付款', value: 'paid' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'canceled' }
];

const currentFilter = ref('all');
const loading = ref(true);
const orders = ref([]);
const currentPage = ref(1);
const total = ref(0);
const totalPages = ref(1);

const showDetail = ref(false);
const detailLoading = ref(false);
const selectedOrder = ref(null);

const statusMap = {
  'all': 'all',
  'pending': '待付款',
  'paid': '已付款',
  'shipped': '已发货',
  'completed': '已完成',
  'canceled': '已取消'
};

const mockOrders = [
  {
    ID: 1,
    order_no: 'ORD202607010001',
    user_id: 1,
    receiver: '张三',
    phone: '13800138000',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    address: '建国路88号',
    total_amount: 199.00,
    status: '已完成',
    created_at: '2026-07-01 14:30:00',
    remark: '',
    items: [
      { id: 1, product_name: '苏绣手帕', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20Suzhou%20embroidery%20handkerchief%2C%20traditional%20craft&image_size=square', spec: '精美礼盒装', quantity: 1, unit_price: 199.00, price: 199.00, subtotal: 199.00 }
    ]
  },
  {
    ID: 2,
    order_no: 'ORD202607020002',
    user_id: 1,
    receiver: '李四',
    phone: '13900139000',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    address: '文三路123号',
    total_amount: 299.00,
    status: '已发货',
    created_at: '2026-07-02 10:15:00',
    remark: '请尽快发货',
    items: [
      { id: 2, product_name: '景德镇青花瓷瓶', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jingdezhen%20blue%20and%20white%20porcelain%20vase&image_size=square', spec: '小号', quantity: 1, unit_price: 299.00, price: 299.00, subtotal: 299.00 }
    ]
  },
  {
    ID: 3,
    order_no: 'ORD202607030003',
    user_id: 1,
    receiver: '王五',
    phone: '13700137000',
    province: '江苏省',
    city: '苏州市',
    district: '姑苏区',
    address: '平江路56号',
    total_amount: 398.00,
    status: '待付款',
    created_at: '2026-07-03 16:45:00',
    remark: '',
    items: [
      { id: 3, product_name: '剪纸窗花套装', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20paper%20cutting%20window%20decorations%2C%20red%20color&image_size=square', spec: '十二生肖', quantity: 2, unit_price: 199.00, price: 199.00, subtotal: 398.00 }
    ]
  }
];

const pageNumbers = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i);
  }
  return pages;
});

function getOrderStatusClass(status) {
  const classMap = {
    '待付款': 'pending',
    '已付款': 'paid',
    '已发货': 'shipped',
    '已完成': 'completed',
    '已取消': 'canceled'
  };
  return classMap[status] || '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

function getOrderItems(order) {
  const items = order.items || [];
  return items.map(item => ({
    ...item,
    price: Number(item.unit_price || item.price || 0),
    image: item.image || '',
    spec: item.spec || '默认规格'
  }));
}

function getOrderItemCount(order) {
  const items = order.items || [];
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function getLocalOrders() {
  try {
    const userId = authStore.user?.id || 'guest';
    const stored = localStorage.getItem(`orders_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('读取本地订单失败:', e);
  }
  return [];
}

function saveLocalOrders(orderList) {
  try {
    const userId = authStore.user?.id || 'guest';
    localStorage.setItem(`orders_${userId}`, JSON.stringify(orderList));
  } catch (e) {
    console.error('保存本地订单失败:', e);
  }
}

async function loadOrders(page = 1) {
  loading.value = true;

  try {
    const localOrders = getLocalOrders();
    
    if (localOrders.length > 0) {
      console.log('[Orders] 使用本地存储订单');
      const status = statusMap[currentFilter.value];
      let filteredOrders = localOrders;
      
      if (status && status !== 'all') {
        filteredOrders = localOrders.filter(o => o.status === status);
      }
      
      total.value = filteredOrders.length;
      totalPages.value = Math.ceil(total.value / 10) || 1;
      const start = (page - 1) * 10;
      const end = start + 10;
      orders.value = filteredOrders.slice(start, end);
      currentPage.value = page;
    } else {
      console.log('[Orders] 使用Mock订单数据');
      const status = statusMap[currentFilter.value];
      let filteredOrders = mockOrders;
      
      if (status && status !== 'all') {
        filteredOrders = mockOrders.filter(o => o.status === status);
      }
      
      total.value = filteredOrders.length;
      totalPages.value = Math.ceil(total.value / 10) || 1;
      const start = (page - 1) * 10;
      const end = start + 10;
      orders.value = filteredOrders.slice(start, end);
      currentPage.value = page;
    }
  } catch (error) {
    console.error('[Orders] 错误:', error);
    orders.value = [];
    total.value = 0;
    totalPages.value = 0;
  } finally {
    loading.value = false;
  }
}

function changePage(page) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    loadOrders(page);
  }
}

function prevPage() {
  changePage(currentPage.value - 1);
}

function nextPage() {
  changePage(currentPage.value + 1);
}

function goToStore() {
  router.push('/store');
}

function goToPayment(orderNo) {
  router.push(`/payment/${orderNo}`);
}

function contactSeller() {
  alert('请通过客服渠道联系卖家');
}

async function confirmReceipt(order) {
  if (!confirm('确认已收到商品？')) return;
  try {
    order.status = '已完成';
    const localOrders = getLocalOrders();
    const idx = localOrders.findIndex(o => o.order_no === order.order_no);
    if (idx >= 0) {
      localOrders[idx].status = '已完成';
      saveLocalOrders(localOrders);
    }
    alert('确认收货成功');
    await loadOrders(currentPage.value);
  } catch (e) {
    alert('操作失败');
  }
}

async function viewDetail(orderNo) {
  detailLoading.value = true;
  showDetail.value = true;
  try {
    let order = null;
    const localOrders = getLocalOrders();
    if (localOrders.length > 0) {
      order = localOrders.find(o => o.order_no === orderNo);
    }
    if (!order) {
      order = mockOrders.find(o => o.order_no === orderNo);
    }
    
    if (order) {
      selectedOrder.value = { order, items: order.items || [] };
    } else {
      alert('订单不存在');
      closeDetail();
    }
  } catch (e) {
    console.error('获取订单详情失败:', e);
    alert('获取订单详情失败');
  } finally {
    detailLoading.value = false;
  }
}

function closeDetail() {
  showDetail.value = false;
  selectedOrder.value = null;
}

function switchFilter(value) {
  currentFilter.value = value;
  loadOrders(1);
}

onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
.orders-page { min-height: 100vh; background: #f5f7fa; }

.page-header {
  background: linear-gradient(135deg, var(--primary-dark), var(--text-dark));
  color: white;
  padding: 80px 0 50px;
  text-align: center;
}
.page-header h1 { font-size: 36px; margin-bottom: 10px; }
.page-header p { font-size: 16px; opacity: 0.8; }

.orders-content { padding: 30px 0 80px; }

.filter-tabs {
  display: flex; gap: 10px; margin-bottom: 20px;
  flex-wrap: wrap;
}
.filter-tab {
  padding: 10px 20px; border: 1px solid var(--border-color);
  border-radius: 25px; background: white;
  cursor: pointer; font-size: 14px; color: var(--text-light);
  transition: all 0.2s;
}
.filter-tab:hover { border-color: var(--primary-color); color: var(--primary-color); }
.filter-tab.active {
  background: var(--primary-color); color: white;
  border-color: var(--primary-color);
}

.loading-text {
  text-align: center; padding: 60px;
  color: var(--text-light); font-size: 16px;
}

.empty-state {
  text-align: center; padding: 60px;
}
.empty-icon { font-size: 64px; margin-bottom: 20px; }
.empty-state p {
  font-size: 16px; color: var(--text-light);
  margin-bottom: 20px;
}

.orders-list {
  display: flex; flex-direction: column; gap: 20px;
}

.order-card {
  background: white; border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}

.order-header {
  display: flex; justify-content: space-between;
  align-items: center; padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  background: #f8f9fa;
}
.order-info { display: flex; gap: 15px; }
.order-no { font-size: 14px; color: var(--text-dark); font-weight: 500; }
.order-date { font-size: 14px; color: var(--text-light); }

.status-badge {
  display: inline-block; padding: 4px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.status-badge.pending { background: rgba(243,156,18,0.1); color: #F39C12; }
.status-badge.paid { background: rgba(52,152,219,0.1); color: #3498DB; }
.status-badge.shipped { background: rgba(155,89,182,0.1); color: #9B59B6; }
.status-badge.completed { background: rgba(39,174,96,0.1); color: #27AE60; }
.status-badge.canceled { background: rgba(149,165,166,0.1); color: #7F8C8D; }

.order-items {
  padding: 15px;
}

.item-card {
  display: flex; gap: 15px; padding: 12px;
  border-bottom: 1px dashed var(--border-color);
}
.item-card:last-child { border-bottom: none; }
.item-image {
  width: 80px; height: 80px; object-fit: cover;
  border-radius: 8px;
}
.item-info { flex: 1; display: flex; flex-direction: column; }
.item-name {
  font-size: 14px; font-weight: 500; color: var(--text-dark);
  margin-bottom: 6px;
}
.item-spec { font-size: 12px; color: var(--text-light); margin-bottom: auto; }
.item-bottom {
  display: flex; justify-content: space-between;
  align-items: center;
}
.item-price { font-size: 14px; color: #E74C3C; font-weight: 600; }
.item-quantity { font-size: 13px; color: var(--text-light); }

.order-footer {
  display: flex; justify-content: space-between;
  align-items: center; padding: 15px 20px;
  background: #f8f9fa;
}
.order-total { font-size: 14px; color: var(--text-dark); }
.total-price {
  font-size: 18px; color: #E74C3C; font-weight: 600;
}

.order-actions { display: flex; gap: 10px; }
.action-btn {
  padding: 8px 18px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 13px; font-weight: 500;
  transition: all 0.2s;
}
.action-btn.primary {
  background: var(--primary-color); color: white;
}
.action-btn.primary:hover { background: var(--primary-dark); }
.action-btn.outline {
  background: white; color: var(--primary-color);
  border: 1px solid var(--primary-color);
}
.action-btn.outline:hover {
  background: var(--primary-color); color: white;
}

.pagination {
  display: flex; justify-content: center; align-items: center;
  gap: 8px; margin-top: 30px;
}
.page-btn {
  width: 36px; height: 36px; border: 1px solid var(--border-color);
  border-radius: 6px; background: white; cursor: pointer;
  font-size: 14px; font-weight: 500;
}
.page-btn:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); }
.page-btn.active {
  background: var(--primary-color); color: white;
  border-color: var(--primary-color);
}
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 2000; display: flex; align-items: center;
  justify-content: center; padding: 20px;
}
.modal-card {
  background: white; border-radius: 14px; width: 520px;
  max-width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  animation: slideUp 0.25s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 25px; border-bottom: 1px solid var(--border-color);
}
.modal-header h3 { font-size: 18px; color: var(--text-dark); }
.modal-close {
  width: 32px; height: 32px; border-radius: 50%;
  border: none; background: #f0f0f0; color: #666;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 16px;
}
.modal-close:hover { background: #e0e0e0; }
.modal-body { padding: 20px 25px; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 15px 25px; border-top: 1px solid var(--border-color);
}
.btn {
  padding: 10px 24px; border: none; border-radius: 8px;
  cursor: pointer; font-size: 14px; font-weight: 500;
}
.btn-primary {
  background: var(--primary-color); color: white;
}
.btn-primary:hover { background: var(--primary-dark); }

.detail-section {
  margin-bottom: 20px; padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}
.detail-section:last-child { border-bottom: none; }
.detail-section h4 {
  font-size: 14px; color: var(--text-dark);
  margin-bottom: 10px; padding-bottom: 6px;
  border-bottom: 1px dashed var(--border-color);
}
.detail-section p {
  font-size: 14px; color: var(--text-light);
  margin-bottom: 6px; line-height: 1.6;
}
.detail-section p span:first-child { color: #666; }
.items-list {
  display: flex; flex-direction: column; gap: 8px;
}
.item-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; background: #f8f9fa;
  border-radius: 8px; font-size: 14px;
}
.total-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--border-color);
  font-size: 16px; font-weight: 600;
}
.total-amount { color: #E74C3C; font-size: 18px; }
</style>
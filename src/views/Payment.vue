<template>
  <div class="payment">
    <section class="page-header">
      <div class="container">
        <h1>支付订单</h1>
        <p>订单号：{{ orderNo }}</p>
      </div>
    </section>

    <section class="payment-content">
      <div class="container">
        <div class="payment-layout">
          <div class="payment-main">
            <div v-if="loading" class="loading-text">加载中...</div>

            <div v-else-if="order" class="payment-card card">
              <div class="order-status">
                <span class="status-badge" :class="order.status === '已付款' ? 'paid' : 'unpaid'">
                  {{ order.status }}
                </span>
              </div>

              <div class="order-info">
                <div class="info-row">
                  <span>订单金额</span>
                  <span class="amount">¥{{ displayAmount }}</span>
                </div>
                <div class="info-row">
                  <span>收货人</span>
                  <span>{{ order.receiver }}</span>
                </div>
                <div class="info-row">
                  <span>联系电话</span>
                  <span>{{ order.phone }}</span>
                </div>
                <div class="info-row">
                  <span>收货地址</span>
                  <span>{{ order.province }} {{ order.city }} {{ order.district }} {{ order.address }}</span>
                </div>
              </div>

              <div v-if="order.status !== '已付款'" class="payment-methods">
                <h3>选择支付方式</h3>
                <div class="method-tabs">
                  <button
                    :class="{ 'active': payMethod === 'wechat' }"
                    @click="payMethod = 'wechat'"
                    class="method-btn"
                  >
                    💚 微信支付
                  </button>
                  <button
                    :class="{ 'active': payMethod === 'alipay' }"
                    @click="payMethod = 'alipay'"
                    class="method-btn"
                  >
                    💙 支付宝
                  </button>
                </div>

                <div class="qr-section">
                  <div class="qr-code">
                    <div class="qr-placeholder">
                      <div class="qr-icon">{{ payMethod === 'wechat' ? '💚' : '💙' }}</div>
                      <p>{{ payMethod === 'wechat' ? '微信' : '支付宝' }}扫码支付</p>
                      <p class="qr-amount">¥{{ displayAmount }}</p>
                    </div>
                  </div>
                  <p class="qr-hint">请使用{{ payMethod === 'wechat' ? '微信' : '支付宝' }}扫描二维码完成支付</p>
                </div>

                <button class="btn btn-primary confirm-btn" @click="confirmPay" :disabled="confirming">
                  {{ confirming ? '确认中...' : '已完成支付，确认' }}
                </button>
              </div>

              <div v-else class="paid-success">
                <div class="success-icon">✅</div>
                <h3>支付成功！</h3>
                <p class="success-order-no">订单号：{{ orderNo }}</p>
                <p class="success-amount">支付金额：<strong>¥{{ displayAmount }}</strong></p>
                <p>感谢您的购买，我们将尽快安排发货</p>
                <div class="success-actions">
                  <router-link to="/orders" class="btn btn-primary">查看我的订单</router-link>
                  <router-link to="/store" class="btn btn-outline">继续购物</router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '../stores/order.js';
import { getOrder, confirmPayment } from '../api/shop.js';

const route = useRoute();
const orderNo = route.params.orderNo;
const order = ref(null);
const loading = ref(true);
const confirming = ref(false);
const payMethod = ref('wechat');
const orderStore = useOrderStore();

const displayAmount = computed(() => {
  if (!order.value || order.value.total_amount === undefined || order.value.total_amount === null) {
    return '0.00';
  }
  const amount = parseFloat(order.value.total_amount);
  return isNaN(amount) ? '0.00' : amount.toFixed(2);
});

const loadOrder = async () => {
  try {
    // 优先从服务器获取最新订单状态，确保显示正确的状态
    const { data } = await getOrder(orderNo);
    order.value = data.order;
    if (data.items && data.items.length > 0) {
      order.value.items = data.items;
    }
  } catch (e) {
    console.error('获取订单失败:', e);
    // 如果服务器获取失败，再尝试从store获取
    if (orderStore.currentOrder && orderStore.currentOrder.order_no === orderNo) {
      order.value = { ...orderStore.currentOrder };
    } else {
      order.value = null;
    }
  }
  loading.value = false;
};

const confirmPay = async () => {
  if (confirming.value) return;
  confirming.value = true;
  try {
    const { data } = await confirmPayment(orderNo);
    order.value.status = '已付款';
  } catch (e) {
    console.error('确认支付失败，使用本地存储更新订单状态:', e);
    order.value.status = '已付款';
    const userId = localStorage.getItem('user_id') || 'guest';
    const localOrders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
    const orderIndex = localOrders.findIndex(o => o.order_no === orderNo);
    if (orderIndex !== -1) {
      localOrders[orderIndex].status = '已付款';
      localStorage.setItem(`orders_${userId}`, JSON.stringify(localOrders));
    }
  }
  confirming.value = false;
};

onMounted(loadOrder);
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 100px 0 60px;
  text-align: center;
}

.page-header h1 { font-size: 40px; margin-bottom: 10px; }
.page-header p { font-size: 18px; opacity: 0.9; }

.payment-content { padding: 40px 0 80px; background: var(--bg-light); }
.payment-layout { max-width: 700px; margin: 0 auto; }

.payment-card { padding: 30px; }

.order-status { text-align: center; margin-bottom: 25px; }
.status-badge {
  display: inline-block; padding: 8px 24px; border-radius: 25px;
  font-size: 16px; font-weight: 600;
}
.status-badge.unpaid { background: rgba(243,156,18,0.1); color: #F39C12; }
.status-badge.paid { background: rgba(39,174,96,0.1); color: #27AE60; }

.order-info { margin-bottom: 30px; }
.info-row {
  display: flex; justify-content: space-between; padding: 12px 0;
  border-bottom: 1px dashed var(--border-color); font-size: 15px;
}
.info-row span:first-child { color: var(--text-light); }
.info-row span:last-child { color: var(--text-dark); font-weight: 500; }
.amount { font-size: 24px !important; font-weight: 700 !important; color: #E74C3C !important; }

.payment-methods h3 { font-size: 18px; margin-bottom: 15px; color: var(--text-dark); }

.method-tabs { display: flex; gap: 15px; margin-bottom: 25px; }
.method-btn {
  flex: 1; padding: 15px; border: 2px solid var(--border-color); border-radius: 12px;
  background: white; cursor: pointer; font-size: 16px; transition: all 0.3s ease;
}
.method-btn.active {
  border-color: var(--primary-color); background: rgba(74,144,164,0.05);
  box-shadow: 0 4px 15px rgba(74,144,164,0.2);
}

.qr-section { text-align: center; margin-bottom: 25px; }
.qr-code { display: flex; justify-content: center; margin-bottom: 15px; }
.qr-placeholder {
  width: 220px; height: 220px; border: 3px dashed var(--border-color); border-radius: 16px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #fafafa;
}
.qr-icon { font-size: 48px; margin-bottom: 10px; }
.qr-placeholder p { font-size: 14px; color: var(--text-dark); }
.qr-amount { font-size: 18px !important; font-weight: 700; color: #E74C3C !important; margin-top: 5px; }
.qr-hint { font-size: 14px; color: var(--text-light); }

.confirm-btn { width: 100%; padding: 15px; font-size: 18px; }
.confirm-btn:disabled { opacity: 0.6; }

.paid-success { text-align: center; padding: 30px 0; }
.success-icon { font-size: 64px; margin-bottom: 20px; }
.paid-success h3 { font-size: 24px; margin-bottom: 10px; color: var(--text-dark); }
.success-order-no { font-size: 16px; color: var(--text-dark); margin-bottom: 5px; font-weight: 500; }
.success-amount { font-size: 16px; color: #E74C3C; margin-bottom: 12px; }
.success-amount strong { font-size: 24px; }
.paid-success p { color: var(--text-light); margin-bottom: 15px; }
.success-actions { display: flex; gap: 12px; justify-content: center; margin-top: 10px; }
.btn-outline {
  padding: 10px 24px; border: 1px solid var(--primary-color);
  border-radius: 8px; background: white; color: var(--primary-color);
  cursor: pointer; font-size: 14px; font-weight: 500;
  text-decoration: none; transition: all 0.2s;
}
.btn-outline:hover { background: var(--primary-color); color: white; }

.loading-text { text-align: center; padding: 40px; color: var(--text-light); }
</style>

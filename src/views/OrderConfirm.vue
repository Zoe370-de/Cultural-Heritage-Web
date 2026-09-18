<template>
  <div class="order-confirm">
    <section class="page-header">
      <div class="container">
        <h1>订单详情</h1>
        <p>订单号：{{ orderNo }}</p>
      </div>
    </section>

    <section class="order-content">
      <div class="container">
        <div v-if="loading" class="loading-text">加载中...</div>
        <div v-else-if="order" class="order-detail card">
          <div class="order-header">
            <span class="status-badge" :class="order.status === '已付款' ? 'paid' : 'unpaid'">
              {{ order.status }}
            </span>
            <span class="order-date">下单时间：{{ order.created_at }}</span>
          </div>

          <div class="order-section">
            <h4>收货信息</h4>
            <p>{{ order.receiver }} · {{ order.phone }}</p>
            <p>{{ order.province }} {{ order.city }} {{ order.district }} {{ order.address }}</p>
            <p v-if="order.remark">备注：{{ order.remark }}</p>
          </div>

          <div class="order-section">
            <h4>商品明细</h4>
            <table class="items-table">
              <thead>
                <tr><th>商品</th><th>单价</th><th>数量</th><th>小计</th></tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.id">
                  <td>{{ item.product_name }}</td>
                  <td>¥{{ item.unit_price }}</td>
                  <td>x{{ item.quantity }}</td>
                  <td class="price-cell">¥{{ item.subtotal }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="order-total">
            <span>实付金额</span>
            <span class="total-amount">¥{{ order.total_amount }}</span>
          </div>

          <div class="order-actions">
            <router-link v-if="order.status !== '已付款'" :to="`/payment/${orderNo}`" class="btn btn-primary">
              去支付
            </router-link>
            <router-link to="/store" class="btn" style="background:#f0f0f0;color:#333;">
              返回商店
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getOrder } from '../api/shop.js';

const route = useRoute();
const orderNo = route.params.orderNo;
const order = ref(null);
const items = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await getOrder(orderNo);
    order.value = data.order;
    items.value = data.items || [];
  } catch (e) {
    order.value = null;
  }
  loading.value = false;
});
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

.order-content { padding: 40px 0 80px; background: var(--bg-light); }
.order-detail { padding: 30px; max-width: 800px; margin: 0 auto; }

.order-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);
}
.status-badge {
  padding: 6px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;
}
.status-badge.unpaid { background: rgba(243,156,18,0.1); color: #F39C12; }
.status-badge.paid { background: rgba(39,174,96,0.1); color: #27AE60; }
.order-date { font-size: 13px; color: var(--text-light); }

.order-section { margin-bottom: 25px; }
.order-section h4 { font-size: 16px; color: var(--text-dark); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); }
.order-section p { font-size: 14px; color: var(--text-light); line-height: 1.8; }

.items-table { width: 100%; border-collapse: collapse; }
.items-table th {
  background: #f8f9fa; padding: 10px 15px; text-align: left;
  font-size: 13px; color: var(--text-light); font-weight: 500;
}
.items-table td {
  padding: 12px 15px; font-size: 14px; color: var(--text-dark);
  border-bottom: 1px solid var(--border-color);
}
.price-cell { color: #E74C3C; font-weight: 600; }

.order-total {
  display: flex; justify-content: flex-end; align-items: center; gap: 15px;
  padding: 20px 0; font-size: 18px; color: var(--text-dark); border-top: 2px solid var(--border-color);
}
.total-amount { font-size: 32px; font-weight: 700; color: #E74C3C; }

.order-actions { display: flex; gap: 15px; justify-content: center; margin-top: 20px; }

.loading-text { text-align: center; padding: 40px; color: var(--text-light); }
</style>

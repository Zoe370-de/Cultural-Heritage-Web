<template>
  <div class="checkout">
    <section class="page-header">
      <div class="container">
        <h1>订单结算</h1>
        <p>填写收货信息，完成订单</p>
      </div>
    </section>

    <section class="checkout-content">
      <div class="container">
        <div class="checkout-layout">
          <div class="checkout-form card">
            <h3>收货信息</h3>
            <div class="form-row">
              <label>收件人 <span class="required">*</span></label>
              <input v-model="form.receiver" type="text" placeholder="请输入收件人姓名" class="form-input">
            </div>
            <div class="form-row">
              <label>手机号 <span class="required">*</span></label>
              <input v-model="form.phone" type="text" placeholder="请输入手机号码" class="form-input">
            </div>
            <div class="form-row form-row-3">
              <div class="form-col">
                <label>省份 <span class="required">*</span></label>
                <select v-model="form.province" class="form-input" @change="onProvinceChange">
                  <option value="">选择省份</option>
                  <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>
              <div class="form-col">
                <label>城市 <span class="required">*</span></label>
                <select v-model="form.city" class="form-input" @change="onCityChange">
                  <option value="">选择城市</option>
                  <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div class="form-col">
                <label>区/县 <span class="required">*</span></label>
                <select v-model="form.district" class="form-input">
                  <option value="">选择区县</option>
                  <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <label>详细地址 <span class="required">*</span></label>
              <input v-model="form.address" type="text" placeholder="街道、楼栋、门牌号" class="form-input">
            </div>
            <div class="form-row">
              <label>备注</label>
              <textarea v-model="form.remark" placeholder="如有特殊要求请备注" class="form-textarea"></textarea>
            </div>
          </div>

          <div class="checkout-summary">
            <div class="summary-card card">
              <h3>订单摘要</h3>
              <div class="summary-items">
                <div v-for="(item, i) in cartItems" :key="i" class="summary-item">
                  <div class="summary-item-info">
                    <span class="summary-name">{{ item.name }}</span>
                    <span class="summary-qty">x{{ item.quantity }}</span>
                  </div>
                  <span class="summary-price">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
              <div class="summary-total">
                <span>合计</span>
                <span class="total-amount">¥{{ total.toFixed(2) }}</span>
              </div>
              <button class="btn btn-primary checkout-btn" @click="submitOrder" :disabled="submitting">
                {{ submitting ? '提交中...' : '提交订单' }}
              </button>
              <router-link to="/store" class="back-store">← 返回商店继续选购</router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart.js';
import { useAuthStore } from '../stores/auth.js';
import { useOrderStore } from '../stores/order.js';

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const orderStore = useOrderStore();

const cartItems = computed(() => cartStore.items);
const total = computed(() => cartStore.totalPrice);
const submitting = ref(false);

const form = ref({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  remark: ''
});

const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '陕西省', '湖南省'];
const citiesByProvince = {
  '北京市': ['北京市'],
  '上海市': ['上海市'],
  '广东省': ['广州市', '深圳市', '东莞市'],
  '浙江省': ['杭州市', '宁波市', '温州市'],
  '江苏省': ['南京市', '苏州市', '无锡市'],
  '四川省': ['成都市', '绵阳市', '宜宾市'],
  '陕西省': ['西安市', '咸阳市', '宝鸡市'],
  '湖南省': ['长沙市', '张家界市', '岳阳市']
};
const districtsByCity = {
  '北京市': ['朝阳区', '海淀区', '东城区', '西城区'],
  '上海市': ['浦东新区', '黄浦区', '徐汇区', '静安区'],
  '广州市': ['天河区', '越秀区', '白云区'],
  '成都市': ['锦江区', '武侯区', '青羊区'],
  '西安市': ['雁塔区', '碑林区', '未央区']
};

const cities = computed(() => citiesByProvince[form.value.province] || []);
const districts = computed(() => districtsByCity[form.value.city] || ['其他区']);

const onProvinceChange = () => {
  form.value.city = '';
  form.value.district = '';
};

const onCityChange = () => {
  form.value.district = '';
};

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

const submitOrder = async () => {
  if (!authStore.isLoggedIn) {
    alert('请先登录');
    return;
  }
  if (!form.value.receiver || !form.value.phone || !form.value.province || !form.value.city || !form.value.address) {
    alert('请填写完整的收货信息');
    return;
  }
  if (cartItems.value.length === 0) {
    alert('购物车为空');
    return;
  }

  const orderData = {
    ID: Date.now(),
    order_no: 'ORD' + Date.now(),
    user_id: authStore.user?.id || 1,
    receiver: form.value.receiver,
    phone: form.value.phone,
    province: form.value.province,
    city: form.value.city,
    district: form.value.district,
    address: form.value.address,
    total_amount: total.value,
    status: '待付款',
    created_at: new Date().toLocaleString('zh-CN'),
    remark: form.value.remark,
    items: cartItems.value.map(item => ({
      id: item.id,
      product_name: item.name,
      image: item.image,
      spec: item.spec || '默认规格',
      quantity: item.quantity,
      unit_price: item.price,
      price: item.price,
      subtotal: item.price * item.quantity
    }))
  };

  submitting.value = true;
  try {
    const localOrders = getLocalOrders();
    localOrders.unshift(orderData);
    saveLocalOrders(localOrders);
    
    orderStore.setOrder(orderData);
    cartStore.clearCart();
    router.push(`/payment/${orderData.order_no}`);
  } catch (e) {
    console.error('订单提交失败:', e);
    alert('订单提交失败，请重试');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  if (cartItems.value.length === 0) {
    router.push('/store');
  }
});
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 100px 0 60px;
  text-align: center;
}

.page-header h1 { font-size: 40px; margin-bottom: 15px; }
.page-header p { font-size: 18px; opacity: 0.9; }

.checkout-content { padding: 40px 0 80px; background: var(--bg-light); }

.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 30px;
}

.checkout-form { padding: 30px; }
.checkout-form h3 { font-size: 20px; margin-bottom: 25px; color: var(--text-dark); }

.form-row { margin-bottom: 20px; }
.form-row label { display: block; font-size: 14px; font-weight: 500; color: var(--text-dark); margin-bottom: 6px; }
.required { color: #E74C3C; }

.form-input {
  width: 100%; padding: 12px 15px;
  border: 1px solid var(--border-color); border-radius: 8px; font-size: 15px; font-family: inherit; outline: none;
}
.form-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(74,144,164,0.1); }

.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }

.form-textarea {
  width: 100%; min-height: 80px; padding: 12px 15px;
  border: 1px solid var(--border-color); border-radius: 8px; font-size: 15px; font-family: inherit; resize: vertical; outline: none;
}
.form-textarea:focus { border-color: var(--primary-color); }

.summary-card { padding: 25px; }
.summary-card h3 { font-size: 18px; margin-bottom: 20px; color: var(--text-dark); }

.summary-items { margin-bottom: 20px; }
.summary-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px dashed var(--border-color);
}
.summary-name { font-size: 14px; color: var(--text-dark); }
.summary-qty { font-size: 13px; color: var(--text-light); margin-left: 8px; }
.summary-price { font-size: 15px; font-weight: 600; color: #E74C3C; }

.summary-total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px 0; font-size: 18px; color: var(--text-dark); border-top: 2px solid var(--border-color);
}
.total-amount { font-size: 28px; font-weight: 700; color: #E74C3C; }

.checkout-btn { width: 100%; padding: 15px; font-size: 18px; margin-bottom: 15px; }
.checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.back-store { display: block; text-align: center; color: var(--text-light); text-decoration: none; font-size: 14px; }
.back-store:hover { color: var(--primary-color); }

@media (max-width: 768px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr; }
}
</style>
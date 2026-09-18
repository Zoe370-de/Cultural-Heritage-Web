<template>
  <div class="manage">
    <section class="page-header">
      <div class="container">
        <h1>管理后台</h1>
        <p>用户管理 · 订单管理 · 帖子管理</p>
      </div>
    </section>

    <section class="manage-content">
      <div class="container">
        <div class="tab-nav">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'users' }"
            @click="activeTab = 'users'"
          >用户管理</button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'orders' }"
            @click="activeTab = 'orders'"
          >订单管理</button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'posts' }"
            @click="activeTab = 'posts'"
          >帖子管理</button>
        </div>

        <div v-if="activeTab === 'users'" class="tab-content">
          <div class="panel-toolbar">
            <div class="toolbar-left">
              <h3>用户列表</h3>
              <span class="user-count">共 {{ users.length }} 人</span>
            </div>
            <div class="toolbar-right">
              <button class="btn btn-primary btn-sm" @click="openAddUserModal">添加用户</button>
            </div>
          </div>

          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>手机号</th>
                  <th>邮箱</th>
                  <th>角色</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.phone || '-' }}</td>
                  <td>{{ user.email || '-' }}</td>
                  <td>
                    <span class="role-badge" :class="user.is_admin ? 'admin' : 'normal'">
                      {{ user.is_admin ? '管理员' : '普通用户' }}
                    </span>
                  </td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td class="action-cell">
                    <button class="action-btn edit" @click="openEditUserModal(user)">改密</button>
                    <button class="action-btn warn" @click="toggleRole(user)">{{ user.is_admin ? '取消管理' : '设为管理' }}</button>
                    <button class="action-btn delete" @click="deleteUserConfirm(user)">删除</button>
                  </td>
                </tr>
                <tr v-if="usersLoading">
                  <td colspan="7" class="empty-cell">加载中...</td>
                </tr>
                <tr v-if="!usersLoading && users.length === 0">
                  <td colspan="7" class="empty-cell">暂无用户数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeTab === 'orders'" class="tab-content">
          <div class="panel-toolbar">
            <div class="toolbar-left">
              <h3>订单列表</h3>
              <span class="user-count">共 {{ orders.length }} 条</span>
            </div>
            <div class="toolbar-right">
              <select v-model="orderStatusFilter" class="search-input" @change="loadOrders(1)">
                <option value="all">全部状态</option>
                <option value="待付款">待付款</option>
                <option value="已付款">已付款</option>
                <option value="已发货">已发货</option>
                <option value="已完成">已完成</option>
                <option value="已取消">已取消</option>
              </select>
            </div>
          </div>

          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>用户</th>
                  <th>商品</th>
                  <th>总金额</th>
                  <th>状态</th>
                  <th>下单时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.order_no">
                  <td>{{ order.order_no }}</td>
                  <td>{{ order.username || '-' }}</td>
                  <td>
                    <div v-if="order.items?.length > 0">
                      {{ order.items[0].product_name }}
                      <span v-if="order.items.length > 1"> +{{ order.items.length - 1 }}件</span>
                    </div>
                    <span v-else>-</span>
                  </td>
                  <td>¥{{ Number(order.total_amount).toFixed(2) }}</td>
                  <td>
                    <span class="role-badge" :class="order.status === '已付款' || order.status === '已完成' ? 'admin' : 'normal'">
                      {{ order.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(order.created_at) || '-' }}</td>
                  <td class="action-cell">
                    <button class="action-btn delete" @click="deleteOrder(order)">删除</button>
                  </td>
                </tr>
                <tr v-if="ordersLoading">
                  <td colspan="7" class="empty-cell">加载中...</td>
                </tr>
                <tr v-if="!ordersLoading && orders.length === 0">
                  <td colspan="7" class="empty-cell">暂无订单数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeTab === 'posts'" class="tab-content">
          <div class="panel-toolbar">
            <div class="toolbar-left">
              <h3>帖子列表</h3>
              <span class="user-count">共 {{ posts.length }} 条</span>
            </div>
            <div class="toolbar-right">
              <button class="btn btn-primary btn-sm" @click="loadPosts(1)">刷新</button>
            </div>
          </div>

          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户</th>
                  <th>内容</th>
                  <th>状态</th>
                  <th>发布时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="post in posts" :key="post.post_id">
                  <td>{{ post.post_id }}</td>
                  <td>{{ post.username || '-' }}</td>
                  <td class="post-content-cell">{{ post.comment }}</td>
                  <td>
                    <span class="role-badge" :class="post.status === 1 ? 'admin' : 'normal'">
                      {{ post.status === 1 ? '已审核' : '待审核' }}
                    </span>
                  </td>
                  <td>{{ formatDate(post.createtime) || '-' }}</td>
                  <td class="action-cell">
                    <button class="action-btn delete" @click="deletePostConfirm(post)">删除</button>
                  </td>
                </tr>
                <tr v-if="postsLoading">
                  <td colspan="6" class="empty-cell">加载中...</td>
                </tr>
                <tr v-if="!postsLoading && posts.length === 0">
                  <td colspan="6" class="empty-cell">暂无帖子数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <div v-if="showAddUser" class="modal-overlay" @click.self="showAddUser = false">
      <div class="modal-card">
        <button class="modal-close" @click="showAddUser = false">✕</button>
        <h3>添加用户</h3>
        <div class="form-group">
          <label>用户名</label>
          <input v-model="addUserForm.username" class="form-input" placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="addUserForm.password" type="password" class="form-input" placeholder="请输入密码" />
        </div>
        <div class="form-group">
          <label>手机号</label>
          <input v-model="addUserForm.phone" class="form-input" placeholder="请输入手机号" />
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="addUserForm.email" class="form-input" placeholder="请输入邮箱" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="addUserForm.is_admin" /> 设为管理员
          </label>
        </div>
        <button class="btn btn-primary" @click="addUserSubmit">确认添加</button>
      </div>
    </div>

    <div v-if="showEditUser" class="modal-overlay" @click.self="showEditUser = false">
      <div class="modal-card">
        <button class="modal-close" @click="showEditUser = false">✕</button>
        <h3>修改密码 - {{ editUserForm.username }}</h3>
        <div class="form-group">
          <label>新密码</label>
          <input v-model="editUserForm.newPassword" type="password" class="form-input" placeholder="请输入新密码" />
        </div>
        <button class="btn btn-primary" @click="editUserSubmit">确认修改</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getUsers, addUser, updateUserRole, updateUserPassword, deleteUser as deleteUserApi } from '../api/admin.js';
import { getAllOrders, deleteOrder as deleteOrderApi } from '../api/shop.js';
import { getPosts as getPostsApi, deleteItem } from '../api/forum.js';

const activeTab = ref('users');

const users = ref([]);
const usersLoading = ref(true);

const orderStatusFilter = ref('all');
const orders = ref([]);
const ordersLoading = ref(true);

const posts = ref([]);
const postsLoading = ref(true);

const showAddUser = ref(false);
const addUserForm = ref({ username: '', password: '', phone: '', email: '', is_admin: false });

const showEditUser = ref(false);
const editUserForm = ref({ id: null, username: '', newPassword: '' });

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

async function loadUsers() {
  usersLoading.value = true;
  try {
    const { data } = await getUsers();
    users.value = data.users || [];
  } catch (e) {
    console.error('加载用户列表失败，使用Mock数据:', e);
    users.value = [
      { id: 1, username: 'admin', phone: '13800138000', email: 'admin@feiyi.com', is_admin: true, created_at: '2026-01-01 00:00:00' },
      { id: 2, username: '非遗爱好者', phone: '13900139000', email: 'user@feiyi.com', is_admin: false, created_at: '2026-03-15 10:30:00' },
      { id: 3, username: '匠心学徒', phone: '13700137000', email: '', is_admin: false, created_at: '2026-05-20 14:20:00' }
    ];
  }
  usersLoading.value = false;
}

async function loadOrders(page = 1) {
  ordersLoading.value = true;
  try {
    const { data } = await getAllOrders(page, 10, orderStatusFilter.value);
    orders.value = data.orders || [];
  } catch (e) {
    console.error('加载订单列表失败，使用Mock数据:', e);
    const allOrders = [
      { order_no: 'ORD202607010001', username: '非遗爱好者', items: [{ product_name: '苏绣手帕' }], total_amount: 199.00, status: '已完成', created_at: '2026-07-01 14:30:00' },
      { order_no: 'ORD202607020002', username: '匠心学徒', items: [{ product_name: '景德镇青花瓷瓶' }], total_amount: 398.00, status: '已发货', created_at: '2026-07-02 10:15:00' },
      { order_no: 'ORD202607030003', username: 'admin', items: [{ product_name: '剪纸窗花套装' }], total_amount: 68.00, status: '待付款', created_at: '2026-07-03 09:00:00' },
      { order_no: 'ORD202607040004', username: '非遗爱好者', items: [{ product_name: '景泰蓝花瓶', product_name: '蜀锦丝巾' }], total_amount: 666.00, status: '已付款', created_at: '2026-07-04 16:45:00' }
    ];
    if (orderStatusFilter.value === 'all') {
      orders.value = allOrders;
    } else {
      orders.value = allOrders.filter(o => o.status === orderStatusFilter.value);
    }
  }
  ordersLoading.value = false;
}

async function loadPosts(page = 1) {
  postsLoading.value = true;
  try {
    const { data } = await getPostsApi(page, 100);
    posts.value = data.posts || [];
  } catch (e) {
    console.error('加载帖子列表失败，使用Mock数据:', e);
    posts.value = [
      { post_id: 1, username: '非遗爱好者A', comment: '今天参观了苏州刺绣博物馆，被苏绣的精美技艺深深震撼！', status: 1, createtime: '2026-07-08 14:30:00' },
      { post_id: 2, username: '文化探索者', comment: '景德镇的青花瓷真的太美了！千年窑火不断，每一件瓷器都承载着匠人的心血。', status: 1, createtime: '2026-07-07 10:15:00' },
      { post_id: 3, username: '匠心学徒', comment: '剪纸艺术真的很神奇，一把剪刀就能剪出万千世界。分享一下我的作品，请大家多多指教！', status: 0, createtime: '2026-07-06 16:45:00' },
      { post_id: 4, username: '戏曲迷', comment: '京剧脸谱的色彩太丰富了，每种颜色都有特定的含义。', status: 1, createtime: '2026-07-05 11:00:00' }
    ];
  }
  postsLoading.value = false;
}

function openAddUserModal() {
  addUserForm.value = { username: '', password: '', phone: '', email: '', is_admin: false };
  showAddUser.value = true;
}

async function addUserSubmit() {
  if (!addUserForm.value.username || !addUserForm.value.password) {
    alert('用户名和密码不能为空');
    return;
  }
  try {
    await addUser(addUserForm.value);
    showAddUser.value = false;
    await loadUsers();
  } catch (e) {
    alert(e.response?.data?.error || '添加失败');
  }
}

function openEditUserModal(user) {
  editUserForm.value = { id: user.id, username: user.username, newPassword: '' };
  showEditUser.value = true;
}

async function editUserSubmit() {
  if (!editUserForm.value.newPassword) {
    alert('新密码不能为空');
    return;
  }
  try {
    await updateUserPassword(editUserForm.value.id, editUserForm.value.newPassword);
    showEditUser.value = false;
  } catch (e) {
    alert(e.response?.data?.error || '修改失败');
  }
}

async function toggleRole(user) {
  const newRole = user.is_admin ? 0 : 1;
  const action = newRole ? '设为管理员' : '取消管理员';
  if (!confirm(`确定要${action}「${user.username}」吗？`)) return;
  try {
    await updateUserRole(user.id, newRole);
    await loadUsers();
  } catch (e) {
    alert(e.response?.data?.error || '操作失败');
  }
}

async function deleteUserConfirm(user) {
  if (!confirm(`确定要删除用户「${user.username}」吗？此操作不可恢复！`)) return;
  try {
    await deleteUserApi(user.id);
    await loadUsers();
  } catch (e) {
    alert(e.response?.data?.error || '删除失败');
  }
}

async function deleteOrder(order) {
  if (!confirm(`确定要删除订单「${order.order_no}」吗？此操作不可恢复！`)) return;
  try {
    await deleteOrderApi(order.order_no);
    await loadOrders();
  } catch (e) {
    alert(e.response?.data?.error || '删除失败');
  }
}

async function deletePostConfirm(post) {
  if (!confirm(`确定要删除帖子 #${post.post_id} 吗？此操作不可恢复！`)) return;
  try {
    await deleteItem('post', post.post_id);
    await loadPosts();
  } catch (e) {
    alert(e.response?.data?.error || '删除失败');
  }
}

onMounted(() => {
  loadUsers();
  loadOrders();
  loadPosts();
});
</script>

<style scoped>
.manage { min-height: 100vh; background: #f5f7fa; }

.page-header {
  background: linear-gradient(135deg, var(--primary-dark), var(--text-dark));
  color: white;
  padding: 80px 0 50px;
  text-align: center;
}
.page-header h1 { font-size: 36px; margin-bottom: 10px; }
.page-header p { font-size: 16px; opacity: 0.8; }

.manage-content { padding: 30px 0 80px; }

.tab-nav {
  display: flex;
  gap: 0;
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.tab-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-light);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.tab-btn.active {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  box-shadow: 0 4px 12px rgba(74, 144, 164, 0.3);
}
.tab-btn:hover:not(.active) {
  color: var(--primary-color);
  background: rgba(74, 144, 164, 0.05);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.toolbar-left { display: flex; align-items: center; gap: 12px; }
.toolbar-left h3 { font-size: 20px; color: var(--text-dark); }
.user-count { font-size: 14px; color: var(--text-light); }
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.search-input {
  padding: 10px 18px; border: 1px solid var(--border-color);
  border-radius: 25px; font-size: 14px; width: 200px; outline: none;
}
.search-input:focus { border-color: var(--primary-color); }

.data-table-wrapper {
  background: white; border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow-x: auto;
}
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td {
  padding: 14px 18px; text-align: left;
  border-bottom: 1px solid var(--border-color); font-size: 14px;
}
.data-table th { background: #f8f9fa; font-weight: 600; color: var(--text-dark); }
.data-table tbody tr:hover { background: rgba(74,144,164,0.03); }

.post-content-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  display: inline-block; padding: 4px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.role-badge.admin { background: rgba(39,174,96,0.1); color: #27AE60; }
.role-badge.normal { background: rgba(149,165,166,0.1); color: #7F8C8D; }

.action-cell { display: flex; gap: 6px; }
.action-btn {
  padding: 5px 12px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 12px; font-weight: 500;
  transition: all 0.2s; white-space: nowrap;
}
.action-btn.edit { background: rgba(52,152,219,0.1); color: #3498DB; }
.action-btn.edit:hover { background: #3498DB; color: white; }
.action-btn.warn { background: rgba(243,156,18,0.1); color: #F39C12; }
.action-btn.warn:hover { background: #F39C12; color: white; }
.action-btn.delete { background: rgba(231,76,60,0.1); color: #E74C3C; }
.action-btn.delete:hover { background: #E74C3C; color: white; }
.empty-cell { text-align: center; padding: 40px !important; color: var(--text-light); }

.btn { padding: 12px 30px; border-radius: 25px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; border: none; }
.btn-primary { background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(74, 144, 164, 0.3); }
.btn-sm { padding: 8px 20px; font-size: 14px; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
  z-index: 3000; backdrop-filter: blur(4px);
}
.modal-card {
  position: relative; background: white; border-radius: 16px;
  padding: 40px; max-width: 450px; width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: modalPop 0.3s ease;
}
@keyframes modalPop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.modal-close {
  position: absolute; top: 15px; right: 15px;
  width: 32px; height: 32px; border: none; background: rgba(0,0,0,0.06);
  border-radius: 50%; font-size: 16px; color: #999; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}
.modal-close:hover { background: rgba(231,76,60,0.15); color: #E74C3C; transform: rotate(90deg); }
.modal-card h3 { font-size: 20px; margin-bottom: 24px; color: var(--text-dark); }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: var(--text-dark); font-weight: 500; }
.form-input {
  width: 100%; padding: 10px 14px; border: 1px solid var(--border-color);
  border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box;
}
.form-input:focus { border-color: var(--primary-color); }
</style>
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/culture',
    name: 'Culture',
    component: () => import('../views/Culture.vue')
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('../views/Community.vue')
  },
  {
    path: '/forum/:postId',
    name: 'ForumPost',
    component: () => import('../views/ForumPost.vue')
  },
  {
    path: '/product/:productId',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue')
  },
  {
    path: '/store',
    name: 'Store',
    component: () => import('../views/Store.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/Checkout.vue')
  },
  {
    path: '/payment/:orderNo',
    name: 'Payment',
    component: () => import('../views/Payment.vue')
  },
  {
    path: '/order/:orderNo',
    name: 'OrderConfirm',
    component: () => import('../views/OrderConfirm.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue')
  },
  {
    path: '/manage',
    name: 'Manage',
    component: () => import('../views/Manage.vue')
  },
  {
    path: '/clothing-detection',
    name: 'ClothingDetection',
    component: () => import('../views/ClothingDetection.vue')
  },
  {
    path: '/interactive',
    name: 'Interactive',
    component: () => import('../views/Interactive.vue')
  },
  {
    path: '/notebook',
    name: 'NoteBook',
    component: () => import('../views/NoteBook.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：保护管理面板
router.beforeEach((to, from, next) => {
  if (to.path === '/manage') {
    const token = localStorage.getItem('token')
    if (!token) {
      next('/')
      return
    }
    // 支持多种token格式：demo_xxx, mock_token_xxx, JWT
    if (token.startsWith('demo_')) {
      try {
        const user = JSON.parse(atob(token.slice(5)));
        if (!user.is_admin) { next('/'); return; }
      } catch (e) { next('/'); return; }
    } else if (token.startsWith('mock_token_')) {
      // Mock登录生成的token格式：mock_token_1
      try {
        const userId = parseInt(token.split('_')[2]);
        // Mock用户数据中，admin用户id为1
        if (userId !== 1) { next('/'); return; }
      } catch (e) { next('/'); return; }
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.isAdmin && !payload.is_admin) { next('/'); return; }
      } catch (e) { next('/'); return; }
    }
  }
  next()
})

export default router

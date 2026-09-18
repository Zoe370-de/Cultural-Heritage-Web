import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAuthStore } from './stores/auth.js'
import { useAppStore } from './stores/app.js'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

const authStore = useAuthStore()
authStore.checkAuth()

const appStore = useAppStore()
appStore.loadFromServer()

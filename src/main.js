import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { markRaw } from 'vue'
import App from './App.vue'
import router from './router'
import Vue3Lottie from 'vue3-lottie'
// import 'vue3-lottie/dist/style.css'

const pinia = createPinia()

// 라우터를 Pinia 플러그인으로 추가
pinia.use(({ store }) => {
  store.router = markRaw(router)
})

const app = createApp(App)

app.use(pinia)
app.use(router)
.use(Vue3Lottie)

app.mount('#app')

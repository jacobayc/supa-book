import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { markRaw } from 'vue'
import App from './App.vue'
import router from './router'

const pinia = createPinia()

// 라우터를 Pinia 플러그인으로 추가
pinia.use(({ store }) => {
  store.router = markRaw(router)
})

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')

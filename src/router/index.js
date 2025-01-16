import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BookDetail from '../views/BookDetail.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/list',
      name: 'List',
      component: BookDetail, // /list 경로에는 책 상세 정보 컴포넌트 표시
      props: route => ({data: JSON.parse(route.query.data) }) // 쿼리 파라미터를 props로 전달
    },
  ],
})

export default router

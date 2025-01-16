// TheHeader.vue
<template>
  <header class="header">
    <div class="header-content">
      <div class="hamburger" @click="toggleMenu">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
      <nav v-if="isMenuOpen" class="menu">
        <button @click="logout" class="logout-button">로그아웃</button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const logout = async () => {
  await authStore.logout();
  router.push('/');
  isMenuOpen.value = false; // 로그아웃 후 메뉴 닫기
};

// onMounted(async () => {
//     const { data: { session } } = await authStore.auth.getSession()
// });

</script>

<style scoped>
.header {
  background-color: #f0f0f0;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  position: relative;
  display: flex;
  justify-content: space-between; /* 로고와 햄버거 버튼 사이 간격 유지 */
  align-items: center;
  max-width: 1680px;
  margin: 0 auto;
}

.logo {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0;
}

.hamburger {
  display: flex; /* 항상 표시 */
  flex-direction: column;
  cursor: pointer;
  padding: 10px;
  margin-left: auto; /* 우측 정렬 */
}

.bar {
  width: 25px;
  height: 3px;
  background-color: #333;
  margin: 3px 0;
  transition: 0.4s;
}

.menu {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 100%;
  right: 20px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-top: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 101;
  outline: 1px solid red;
}

.menu .logout-button {
  display: block;
  width: 100%;
  padding: 10px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.menu .logout-button:last-child {
  border-bottom: none;
}

/* 미디어 쿼리 제거 */
/* @media (max-width: 768px) {
  .hamburger {
    display: flex;
  }
  nav {
    display: none;
  }
} */
</style>
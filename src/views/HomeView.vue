<template>
  <div class="app-container">
    <div v-if="isLoading"></div>
    <template v-else>
      <TheHeader v-if="authStore.isLoggedIn" />
      <main>
        <TheIntro v-if="!authStore.isLoggedIn" />
        <TheWelcome v-if="authStore.isLoggedIn" />
      </main>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import TheIntro from '../components/TheIntro.vue';
import TheWelcome from '../components/TheWelcome.vue';
import TheHeader from '../components/Header.vue';
import { useAuthStore } from '../stores/auth';
import { useVisitorStore } from '../stores/visitor';

const authStore = useAuthStore();
const visitorStore = useVisitorStore()
const isLoading = ref(true); // 로딩 상태 추가

onMounted(async () => {
  try {
    await authStore.checkSession();
  } finally {
    isLoading.value = false;
  }
  try {
    await visitorStore.saveVisitor()
  } catch (error) {
    console.log(error,"not access visitor")
  }
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column; /* main 콘텐츠가 header 아래에 배치되도록 설정 */
}

main {
  flex-grow: 1; /* main 콘텐츠가 남은 공간을 채우도록 설정 */
}
</style>
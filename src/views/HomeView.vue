<template>
  <div class="app-container">
    <TheHeader v-if="authStore.isLoggedIn" />
    <main>
      <TheIntro v-if="!authStore.isLoggedIn" />
      <TheWelcome v-if="authStore.isLoggedIn" />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import TheIntro from '../components/TheIntro.vue';
import TheWelcome from '../components/TheWelcome.vue';
import TheHeader from '../components/Header.vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.checkSession();
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
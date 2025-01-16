<template>
  <div class="detailPage">
    <button class="back-button" @click="goBack">Back</button>
    <div class="contents">
      <h1> {{ data.title }}</h1>
      <h3> {{ data.text }}</h3>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  data: {
    type: String,
    required: true,
  },
});

const router = useRouter();

const goBack = () => {
  router.push('/'); // '/' 경로로 이동
};
</script>

<style scoped>
.detailPage {
  width: 100%;
  position: fixed; /* 상대 위치 설정 */
  top: 40px;
}

.contents {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

h1 {
  text-align: center;
  text-decoration: underline;
  padding-bottom: 20px;
}

.back-button {
  position: absolute; /* 절대 위치 설정 */
  top: 10px;
  right: 20px;
  padding: 8px 16px;
  background-color: #42b983; /* Vue green */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease; /* Hover 효과를 부드럽게 */
}

.back-button:hover {
  background-color: #35936a;
}
</style>
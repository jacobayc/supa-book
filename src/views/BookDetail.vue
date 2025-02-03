<template>
  <div class="detailPage">
    <button class="back-button" @click="goBack">Back</button>
    <!-- 조건부 렌더링 추가 -->
    <div v-if="book" class="contents">
      <h1>" {{ book.title }} "</h1>
      <h3>
        <Highlighter
          :searchWords="searchTermArray"
          :textToHighlight="book.text"
          highlightClassName="highlights"
          :highlightStyle="{ color: '#000 !important', background: 'rgb(204, 204, 153)' }"
        />
      </h3>
    </div>
    <div v-else>Loading...</div>
  </div>
</template>

<script setup>
import { defineProps, onMounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useBookStore } from '../stores/book';
import Highlighter from 'vue-highlight-words'

const route = useRoute()
const router = useRouter();
const bookStore = useBookStore();
const book = ref(null);
const searchTerm = ref('');

// props로 쿼리 파라미터 직접 받기
// const props = defineProps({
//   id: {
//     type: String,
//     default: null
//   }
// })

onMounted(async () => {

  // 현재 페이지 조회
  const bookId = route.params?.id

   // 쿼리 파라미터에서 검색어 추출 하이라이트 처리 위함
  searchTerm.value = route.query?.search || '';
  // 현 페이지에 맞는 책 조회
  await bookStore.fetchBookById(bookId);
  book.value = bookStore.currentBook
});

const searchTermArray = computed(() => {
  return searchTerm.value ? [searchTerm.value] : [];
});


const goBack = () => {
  router.push('/');
};
</script>

<style scoped>
.detailPage {
  width: 100%;
  /* height: 1000px; */
  padding-bottom: 100px;
}

.contents {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

h3 {
  width: 100%;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

h1 {
  text-align: center;
  padding: 40px 0px;
  color: salmon;
}

.back-button {
  position: absolute; /* 절대 위치 설정 */
  top: 15px;
  right: 10px;
  padding: 4px 8px;
  /* background-color: #42b983; Vue green */
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease; /* Hover 효과를 부드럽게 */
}

.back-button:hover {
  background-color: #35936a;
}

@media (max-width: 1199px) { /* 1200px 미만 */
  h1 {
    font-size: 20px;
    overflow: hidden; /* 내용이 넘칠 경우 숨김 */
    text-overflow: ellipsis; /* 말줄임표(...) 표시 */
    white-space: nowrap; /* 줄바꿈 방지 */
  }
  .contents {
    font-size: 13px;
  }
}
</style>
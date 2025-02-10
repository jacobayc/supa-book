<template>
  <div class="detailPage">
    <button class="back-button" @click="goBack">나가기</button>
    <!-- 조건부 렌더링 추가 -->
    <div v-if="book" class="contents">
      <h1>" {{ book.title }} "</h1>
      <div class="markdown-content">
        <div v-html="markdownContent"></div>
        <!-- <Highlighter
          :searchWords="searchTermArray"
          :textToHighlight="compiledContent"
          highlightClassName="highlights"
          :highlightStyle="{ color: '#000 !important', background: 'rgb(204, 204, 153)' }"
          :autoEscape="false"
        /> -->
      </div>
    </div>
    <div v-else>Loading...</div>
  </div>
</template>

<script setup>
import { defineProps, onMounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useBookStore } from '../stores/book';
import Highlighter from 'vue-highlight-words'
import { marked } from 'marked';
import DOMPurify from 'dompurify';


const route = useRoute()
const router = useRouter();
const bookStore = useBookStore();
const book = ref(null);
const searchTerm = ref('');
const markdownContent = ref('');

// marked 설정
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

onMounted(async () => {
  // 현재 페이지 조회
  const bookId = route.params?.id
  searchTerm.value = route.query?.search || '';

  // 현 페이지에 맞는 책 조회
  await bookStore.fetchBookById(bookId);
  console.log(bookStore.currentBook)
  book.value = bookStore.currentBook

  // book.value.text가 있을 때 마크다운 처리
  if (book.value?.text) {
    markdownContent.value = DOMPurify.sanitize(marked(book.value.text));
  }
});


const goBack = () => {
  const previousPage = route.query?.page || '1';
  const previousSearch = route.query?.search || '';
  router.push({
    path: '/',
    query: { 
      page: previousPage,
      search: previousSearch 
    }
  });
};
</script>

<style scoped>
.detailPage {
  width: 100%;
  height: 100vh;
  background: #222;
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

h1 {
  text-align: center;
  padding: 40px 0px;
  color: salmon;
}

.markdown-content {
  width: 100%;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}


.back-button {
  position: fixed; /* 절대 위치 설정 */
  top: 15px;
  right: 10px;
  padding: 6px 10px;
  /* background-color: #42b983; Vue green */
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: background-color 0.3s ease; /* Hover 효과를 부드럽게 */
}

.back-button:hover {
  background-color: #35936a;
}

/* 🟨 마크다운 스타일 추가 🟨 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-bottom: 10px;
  font-weight: 600;
  line-height: 1;
}
.markdown-content :deep(li) {
  line-height:1.2;
}
.markdown-content :deep(code) {
  padding: 0.2em 0.4em;
  background-color: rgba(27,31,35,0.05);
  border-radius: 3px;
}
.markdown-content :deep(pre) {
  padding: 16px;
  background-color: #f6f8fa;
  border-radius: 3px;
}
.markdown-content :deep(blockquote) {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

.highlights {
  background-color: rgb(204, 204, 153) !important;
  color: #000 !important;
}

@media (max-width: 1199px) { /* 1200px 미만 */
  h1 {
    font-size: 20px;
    font-weight: 700;
    overflow: hidden; /* 내용이 넘칠 경우 숨김 */
    text-overflow: ellipsis; /* 말줄임표(...) 표시 */
    white-space: nowrap; /* 줄바꿈 방지 */
  }
  .contents {
    font-size: 14px;
  }
}
</style>
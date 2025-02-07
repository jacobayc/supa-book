<template>
  <div class="main-list">
    <div class="info">
      <div :style="{
        backgroundImage: `url(${authStore.user.avatar_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }"></div>
      <p v-if="user"><span>{{ user.name }}<span style="font-size:12px;">( {{ user.nickname }} )</span></span><b> 님</b></p>
    </div>
    <div v-if="bookStore.error">Error: {{ bookStore.error.message }}</div>
    <div class="tools">
      <div class="search-area">
        <input 
          type="text" 
          v-model="searchText" 
          placeholder="검색..."
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button style="margin-right:10px;" class="search-button" @click="handleSearch">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
      <div class="button-area">
        <button class="write-button"  @click="showModal = !showModal">글쓰기</button>
        <button class="edit-button"  @click="toggleEditMode">수정</button>
        <button class="delete-button" @click="toggleDeleteMode">
          <svg width="20" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V7H6V19Z" fill="#efefef"/>
            <path d="M19 4H5V6H19V4Z" fill="#efefef"/>
            <path d="M12 2C10.8954 2 10 2.89543 10 4H14C14 2.89543 13.1046 2 12 2Z" fill="#efefef"/>
          </svg>
        </button>
      </div>
    </div>
    <ul v-if="paginatedBooks.length" class="book-list">
      <li v-for="(book, index) in paginatedBooks" :key="book.id" :class="{ 'new-book': index == 0 && currentPage == 1 }" class="book-item" @click="handleBookClick(book)">
        <p class="book-index">{{ (totalPages - currentPage) * itemsPerPage + (paginatedBooks.length - 1 - index) }} </p>
        <p class="book-title">
          <mark v-for="(part, index) in highlightParts(book.title)" 
                :key="index"
                :class="{ 'highlight': part.isMatch }">
            {{ part.text }}
          </mark>
        </p>
        <p class="book-email">{{ book.email == user?.email ? `${book.nickname} (내 글)` : book.name }}</p>
        <p class="book-count">{{ book.count_num }}</p>
        <p class="book-created-at">{{ book.formattedCreatedAt ? book.formattedCreatedAt : '방금전' }}</p>
        <b class="new-badge" v-show="currentPage === 1 && index === 0">
          <Vue3Lottie 
            class="lottie"
            :animationData="animationJSON"
            :speed= ".5"
          />
        </b>
        <button v-show="showTrashBin && book.email == user.email || (showTrashBin && adminUserCheck)" class="book-delete-btn"  @click.stop="deleteBook(book.id, book.email)"></button>
        <button v-show="isEditMode && book.email == user.email || (isEditMode && adminUserCheck)" class="book-edit-btn" @click.stop="editBook(book)">수정</button>
      </li>
    </ul>
    <p class="empty" v-else-if="!bookStore.loading && !bookStore.error">No books found.</p>

    <!-- 페이지네이션 컨트롤 추가 -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        :disabled="currentPage === 1"
        @click="prevPage"
        class="page-button"
      >이전</button>
      
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      
      <button 
        :disabled="currentPage === totalPages"
        @click="nextPage"
        class="page-button"
      >다음</button>
    </div>
    
    
    <modal  
     :open="showModal"
     :initialTitle="currentBook?.title"
     :initialText="currentBook?.text"
     :isEditMode="!!currentBook"
     @save="saveBookToStore" 
     @close="closeModal"
     >
    </modal>
    <div class="loading" v-if="bookStore.loading">
      <Vue3Lottie 
        class="lottie"
        :animationData="loadingJSON"
        :speed= ".3"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useBookStore } from '../stores/book';
import { useRouter } from 'vue-router';
import { supabase } from '../utils/supabaseClient';
import emitter from '../utils/eventBus'
import Modal from '../components/Modal.vue'; 
import { Vue3Lottie } from 'vue3-lottie'
import animationJSON from '@/assets/new.json'
import loadingJSON from '@/assets/loading.json'

const router = useRouter();
const authStore = useAuthStore();
const bookStore = useBookStore();
const user = ref(null);
const newBook = ref({ title: '', text: '', email:authStore.user?.email, name: authStore.user?.name, nickname: authStore.user?.nickname });
const showModal = ref(false);
const showTrashBin = ref(false);
const isEditMode = ref(false);
const currentBook = ref(null);
const searchText = ref(''); // 검색 입력 값
const searchResult = ref('');
const currentPage = ref(1); // 페이지네이션 관련 상태 추가
const itemsPerPage = 10;

const handleSearch = () => {
  searchResult.value = searchText.value;
};

onMounted(async () => {
  await authStore.checkSession();
  user.value = authStore.user; 
  newBook.value.email = authStore.user?.email
  newBook.value.name = authStore.user?.name
  newBook.value.nickname = authStore.user?.nickname
  bookStore.fetchBooks();
  emitter.on('session-updated', async () => {
    await authStore.checkSession()
    user.value = authStore.user
  })
  emitter.on('avatar-updated', async () => {
    await authStore.checkSession()
  })
});

onUnmounted(() => {
  // 이벤트 리스너 제거
  emitter.off('session-updated')
})

// 페이지네이션된 도서 목록을 계산하는 computed 속성
const paginatedBooks = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredBooks.value.slice(startIndex, endIndex);
});

// 전체 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(filteredBooks.value.length / itemsPerPage);
});

// 페이징 이동 메서드
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const adminUserCheck = computed (()=> {
  return (
    authStore.user?.email == 'jacobyc@spotv.net' ||
    authStore.user?.email == 'kyuheejeon90@gmail.com' ||
    authStore.user?.email == 'yaechan123@naver.com'
  )
})

// 필터링된 도서 목록을 반환하는 computed 속성 추가
const filteredBooks = computed(() => {
  if (!searchResult.value) return bookStore.books;
  
  return bookStore.books.filter(book => 
    book.title.includes(searchResult.value) || book.text.includes(searchResult.value)
  );
});

// 검색 text 하이라이트 처리
const highlightParts = (text) => {
  if (!searchResult.value) return [{ text, isMatch: false }];
  
  const parts = text.split(searchResult.value);
  const result = [];
  
  parts.forEach((part, index) => {
    if (index > 0) {
      result.push({ text: searchResult.value, isMatch: true });
    }
    if (part) {
      result.push({ text: part, isMatch: false });
    }
  });
  
  return result;
};


const handleBookClick = async (book) => {
  const bookIndex = bookStore.books.findIndex(b => b.id === book.id);
    if (bookIndex !== -1) {
      // 1. 로컬 상태 즉시 업데이트 (낙관적 업데이트)
      const updatedBooks = [...bookStore.books];
      const newCount = (updatedBooks[bookIndex].count_num || 0) + 1;
      updatedBooks[bookIndex] = { ...updatedBooks[bookIndex], count_num: newCount };
      bookStore.books = updatedBooks;

      // 2. 백그라운드에서 DB 업데이트
      try {
          const { error } = await supabase
              .from('books')
              .update({ count_num: newCount }) // newCount로 업데이트
              .eq('id', book.id);

          if (error) {
              console.error('Database update error:', error);
              // DB 업데이트 실패 시 로컬 상태 롤백
              const originalBooks = [...bookStore.books];
              originalBooks[bookIndex] = book; // 원래 book으로 복구
              bookStore.books = originalBooks;
              alert("조회수 업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.");
          }
      } catch (dbError) {
          console.error('Database update error:', dbError);
          const originalBooks = [...bookStore.books];
          originalBooks[bookIndex] = book;
          bookStore.books = originalBooks;
          alert("조회수 업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
  }

  router.push({
    path: `/list/${book.id}`,
    query: { 
      search: searchResult.value // 검색어를 쿼리 파라미터로 전달
    }
  });
};

const closeModal = () => {
  showModal.value = false
  currentBook.value = null
  isEditMode.value = false
}

const saveBookToStore  = async (bookData, isEdit) => {
  // 수정모드
  if (isEdit) {
    // 수정 로직
    bookStore.updateBook({
      id: currentBook.value.id,
      ...bookData
    })
    alert('수정이 완료되었습니다.')
    showModal.value = false;
    isEditMode.value = false;
    
    //edit완료후 edit 모드 종료
    currentBook.value = null
  } else { //일반 작성 모드
    newBook.value.email = authStore.user?.email
    newBook.value.name = authStore.user?.name
    newBook.value.nickname = authStore.user?.nickname
    newBook.value = { ...newBook.value, ...bookData };
    try {
      await bookStore.saveBook(newBook.value);
      newBook.value = { title: '', text: ''};
      showModal.value = false;
    } catch (error) {
      console.error('책 저장 중 오류:', error);
      alert('글 작성에 실패했습니다.')
    }
  }
};

const deleteBook = async (bookId, bookEmail) => {
  if (!user.value) {
      alert("로그인 후 이용해주세요.");
      router.push('/');
      return;
  }
  if (confirm('정말로 삭제하시겠습니까?')) { // confirm 메시지 한국어로 변경
    if (bookEmail === user.value.email) { // bookEmail과 user.value.email 비교
      try {
          await bookStore.deleteBook(bookId);
          bookStore.books = bookStore.books.filter(book => book.id !== bookId);
      } catch (error) {
          console.error('글 삭제 오류:', error);
          alert("글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요."); // 에러 메시지 사용자 친화적으로 변경
      }
    } else {
        alert("본인이 작성한 글만 삭제할 수 있습니다.");
    }
  }
};

const editBook = (book) => {
  currentBook.value = book
  showModal.value = true
}

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  showTrashBin.value = false
}

const toggleDeleteMode = () => {
  showTrashBin.value = !showTrashBin.value
  isEditMode.value = false
}


</script>

<style scoped>
.main-list {
  position: relative;
  width: 100%;
  padding: 90px 0;
}

.info {
  display: flex;
  width: fit-content;
  height: 40px;
  transform:translateY(-5px);
  margin: 0 auto;
  font-size: 12px;
}

.info >div {
  width: 50px;
  height: 50px;
  border-radius: 100%;
  transform:translate(-10px , -10px);
}

.info p span {
  color: salmon;
  font-size: 17px;
}

.book-list { /* New class for the list */
  min-height: 520px;
  width: 100%;
  max-width: 1200px;
  list-style: none; /* Remove default bullet points */
  padding: 0;
  margin: 0 auto;
}

.book-item { /* New class for list items */
  width: 98%;
  margin: 10px auto;
  display: flex; /* Arrange items horizontally */
  align-items: center; /* Vertically align content within items */
  padding: 10px 0px; /* Add some padding */
  outline: 1px solid rgba(250,128,114, .3); 
  cursor: pointer; /* Make items clickable (optional) */
  position: relative;
}

.book-item .book-delete-btn {
  position: absolute;
  right: 3px;
  top: 8px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  background-color: transparent;
  border: none;
  background-image: url('@/assets/trashbin.png');
  background-size: 100% 100%; 
  background-repeat: no-repeat; 
}

.book-item .book-edit-btn {
  position: absolute;
  right: 0px;
  top: 10px;
  cursor: pointer;
  font-size: 12px;
  border-radius: 999px;
  width: 40px;
  height: 25px;
  background-color: #222;
  color:#2affcc; 
  border:none; 
}

.book-item p { /* Styles for paragraphs within list items */
  margin: 0 3px; /* Add some space between paragraphs */
  position: relative;
}

.book-item p:first-child { /* Style the first paragraph (book ID) */
  font-weight: bold;
}

.new-book {
  outline: 1px solid rgb(169, 220, 250);
  position: relative;
}

.new-badge {
  position: absolute;
  left: -15px;
  top: -25px;
  display: block;
  width: 50px;
  height: 50px;
  /* background:red; */
  /* background-image: url('@/assets/new_badge.png');
  background-size: contain; 
  background-repeat: no-repeat; */
}

.lottie {
  transform:scale(2);
}

.book-index {
  color: #298f77;
  width: 2%; 
  font-size: 10px;
  letter-spacing: -1px;
  text-align: center;
}
.book-count {
  width: 2%; 
  font-size: 10px;
  letter-spacing: -1px;
  text-align: center;
  color: rgb(205, 247, 177);
}

.book-title {
  width: 65%;
  font-size: 17px;
  font-weight: 600;
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 말줄임표(...) 표시 */
  white-space: nowrap; /* 줄바꿈 방지 */
}

mark {
  background: none;
  color: #fff;
  padding: 0;
}

mark.highlight {
  background-color: rgb(204, 204, 153);
  color: #000;
  padding: 2px;
  border-radius: 2px;
}

.book-email {
  width: 15%;
  text-align: center;
  font-size: 12px;
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 말줄임표(...) 표시 */
  white-space: nowrap; /* 줄바꿈 방지 */
  color: rgb(199, 212, 247);
}

.book-created-at {
  width: 10%;
  font-size: 12px;
  text-align: right;
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 말줄임표(...) 표시 */
  white-space: nowrap; /* 줄바꿈 방지 */
  color: rgb(155, 154, 153);
}

.pagination {
  position: absolute;
  left: 50%;
  transform:translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.page-button {
  padding: 5px 15px;
  border: none;
  border-radius: 5px;
  background-color: #51a354;
  color: white;
  cursor: pointer;
}

.page-button:disabled {
  background-color: #818181;
  cursor: not-allowed;
}

.page-info {
  color: #fff;
  font-size: 14px;
}

.empty {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%);
}

.tools {
  display: flex; 
  width: 100%;
  max-width: 1200px;
  margin: 20px auto 10px;
  text-align: right;
}

.search-area {
  text-align: left;
  width: 50%;
}

.button-area {
  width: 50%;
}

.search-button {
  display: inline-block;
  background-color: #b39f9f00;
  margin-right: 10px;
  width: 24px;
  min-width: 34px !important; 
}

.search-input {
  max-width: 200px;
  display: inline-block;
  width: 90% !important;
  height: 70%;
  transform:translateY(-8px);
  font-size: 12px;
  padding: 5px 10px;
  background: #222;
  color: #2affcc;
  outline: 1px solid #ddd;
  border-radius: 5px;
}

.tools button {
  font-size: 11px;
  height: 24px;
  margin: 0 3px;
  min-width: 46px;
  outline: none;
  border: none;
  color: white;
  border-radius: 10px;
  cursor: pointer;
}


.write-button {
  background-color: #5a8d5b; /* Green for "Write" */
}

.edit-button {
  background-color: #e77171; /* Green for "Write" */
}

.delete-button {
  transform:translateY(9px);
  background-color: #77423f; /* Red for "Delete" */
}

button:hover {
  opacity: 0.5; /* Slight opacity change on hover */
}

.loading {
  padding: 0px 40px;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform:translate(-50%);
  width: 100%;
  max-width: 100px;
  margin: 0 auto;
}


@media (max-width: 1199px) { /* 1200px 미만 */
  .tools {
    width: 90%;
  }

  .search-input {
    max-width: 130px;
  }
  
  .book-item {
    width: 90%;
  }

  .book-item p {
    /* outline: 1px solid blue; */
    margin: 0 4px;
  }
  .book-index, .book-count {
    width: 3%; 
  }
  .book-title {
    letter-spacing: -1.2px;
    font-size: 14px;
    width: 35%;
  }

  .book-email {
    letter-spacing: -1px;
    width: 20%;
  }
  .book-created-at {
    letter-spacing: -1px;
    width: 25%;
  }
  .lottie {
    transform:scale(1.3);
  }
}
</style>
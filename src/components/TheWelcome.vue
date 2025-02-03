<template>
  <div class="main-list">
    <div class="info">
      <p v-if="user"> <b>Welcome</b> <span>{{ user.name }}({{ user.nickname }})</span><b> 님</b></p>
    </div>
    <div v-if="bookStore.error">Error: {{ bookStore.error.message }}</div>
    <div class="tools">
      <input 
        type="text" 
        v-model="searchText" 
        placeholder="검색..."
        class="search-input"
        @keyup.enter="handleSearch"
        style="max-width:100px;"
      />
      <button style="margin-right:10px;" class="search-button" @click="handleSearch">Search</button>
      <button class="write-button"  @click="showModal = !showModal">Write</button>
      <button class="edit-button"  @click="toggleEditMode">Edit</button>
      <button class="delete-button" @click="toggleDeleteMode">Delete</button>
    </div>
    <ul v-if="filteredBooks.length" class="book-list">
      <li v-for="(book, index) in filteredBooks" :key="book.id" :class="{ 'new-book': index === 0 }" class="book-item" @click="handleBookClick(book)">
        <p class="book-index">{{ bookStore.books.length - 1 - index }}</p>
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
        <b class="new-badge" v-show = "index == 0">
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
    <modal  
     :open="showModal"
     :initialTitle="currentBook?.title"
     :initialText="currentBook?.text"
     :isEditMode="!!currentBook"
     @save="saveBookToStore" 
     @close="showModal = false"
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
const searchText = ref('');
const searchResult = ref('');

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
});

onUnmounted(() => {
  // 이벤트 리스너 제거
  emitter.off('session-updated')
})

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
  width: fit-content;
  height: 40px;
  transform:translateY(-5px);
  margin: 0 auto;
  font-size: 12px;
}

.info p span {
  color: salmon;
  font-size: 17px;
}

.book-list { /* New class for the list */
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
  outline: 2px solid pink;
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
  color: #2affcc;
  width: 2%; 
  font-size: 12px;
  text-align: center;
}
.book-count {
  width: 2%; 
  font-size: 12px;
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
}

.book-created-at {
  width: 10%;
  font-size: 12px;
  text-align: right;
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 말줄임표(...) 표시 */
  white-space: nowrap; /* 줄바꿈 방지 */
  color: rgb(209, 137, 4);
}

.empty {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%);
}

.tools {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  text-align: right;
  /* display: flex; */
  /* position: absolute; */
  /* top: 58px; */
  /* right: 10px; */
  /* justify-content: space-between; */
}

.tools button {
  height: 24px;
  margin: 0 3px;
  min-width: 46px;
  outline: none;
  border: none;
  color: white;
  border-radius: 10px;
  cursor: pointer;
}

.search-button {
  background-color: #666;
  margin-right: 10px;
}

.search-input {
  font-size: 12px;
  padding: 5px 10px;
  margin-right: 2px;
  border: 1px solid #ddd;
  border-radius: 5px;
  height: 24px;
}

.write-button {
  background-color: #4CAF50; /* Green for "Write" */
}

.edit-button {
  background-color: #f39c9c; /* Green for "Write" */
}

.delete-button {
  background-color: #f44336; /* Red for "Delete" */
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
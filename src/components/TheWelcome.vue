<template>
  <div class="main-list">
    <div class="info">
      <p v-if="user"> <b>Welcome</b> <span>{{ user.name }}</span></p>
    </div>
    <div v-if="bookStore.error">Error: {{ bookStore.error.message }}</div>
    <ul v-if="bookStore.books.length" class="book-list">
      <li v-for="(book, index) in bookStore.books" :key="book.id" :class="{ 'new-book': index === 0 }" class="book-item" @click="handleBookClick(book)">
        <p class="book-index">{{ bookStore.books.length - 1 - index }}</p>
        <p class="book-title">{{ book.title }}</p>
        <p class="book-email">{{ book.name == user?.name ? `${book.name} (내 글)` : book.name }}</p>
        <p class="book-count">{{ book.count_num }}</p>
        <p class="book-created-at">{{ book.formattedCreatedAt ? book.formattedCreatedAt : 'just completed it' }}</p>
        <b class="new-badge" v-show = "index == 0"></b>
        <button v-show="showTrashBin" @click.stop="deleteBook(book.id, book.email)"></button>
      </li>
    </ul>
    <p class="empty" v-else-if="!bookStore.loading && !bookStore.error">No books found.</p>
    <div class="tools">
      <button class="write-button" @click="showModal = !showModal">Write</button>
      <button class="delete-button" @click="showTrashBin = !showTrashBin">Delete</button>
    </div>
    <modal :newBook="newBook" :open="showModal" @save="saveBook" @close="showModal = false"></modal>
    <div style="font-size: 100px; color: #222; position: fixed; left: 50%; top: 50%; transform: translate(-50%);" v-if="bookStore.loading">Loading...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useBookStore } from '../stores/book';
import { useRouter } from 'vue-router';
import { supabase } from '../utils/supabaseClient';
import Modal from '../components/Modal.vue'; 

const router = useRouter();
const authStore = useAuthStore();
const bookStore = useBookStore();
const user = ref(null);
const newBook = ref({ title: '', text: '', email:'', name: '' });
const showModal = ref(false);
const showTrashBin = ref(false);

onMounted(async () => {
  await authStore.checkSession();
  user.value = authStore.user; 
  newBook.value.email = authStore.user.email
  newBook.value.name = authStore.user.name
  bookStore.fetchBooks();
});



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
    path: '/list',
    query: { data: JSON.stringify(book) }, // Include text in query
  });
};

const saveBook = async () => {
  await bookStore.saveBook(newBook.value);
  newBook.value = { title: '', text: ''};
  showModal.value = false;
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
}

.info p span {
  color: salmon;
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
}

.book-item button {
  transform:translateX(10px);
  cursor: pointer;
  width: 25px;
  height: 25px;
  background-color: transparent;
  border: none;
  background-image: url('@/assets/trashbin.png');
  background-size: contain; 
  background-repeat: no-repeat; 
}

.book-item p { /* Styles for paragraphs within list items */
  margin: 0 3px; /* Add some space between paragraphs */
}

.book-item p:first-child { /* Style the first paragraph (book ID) */
  font-weight: bold;
}

.new-book {
  outline: 1px solid pink;
  position: relative;
}

.new-badge {
  position: absolute;
  left: -25px;
  top: -25px;
  display: block;
  width: 100px;
  height: 40px;
  background-image: url('@/assets/new_badge.png');
  background-size: contain; /* 또는 cover, auto 등 필요에 따라 조절 */
  background-repeat: no-repeat; /* 이미지 반복 방지 */
}

.book-index {
  color: #888;
  width: 2%; 
  font-size: 12px;
  text-align: center;
}
.book-count {
  width: 2%; 
  font-size: 12px;
  text-align: center;
  color: rgb(170, 73, 170);
}

.book-title {
  width: 65%;
  font-size: 17px;
  font-weight: 600;
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 말줄임표(...) 표시 */
  white-space: nowrap; /* 줄바꿈 방지 */
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
}

.empty {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%);
}

.tools {
  display: flex;
  position: absolute;
  top: 10px;
  right: 10px;
  width: 100px;
  justify-content: space-between;
}

.tools button {
  height: 24px;
  min-width: 46px;
  outline: none;
  border: none;
  color: white;
  border-radius: 10px;
  cursor: pointer;
}

.write-button {
  background-color: #4CAF50; /* Green for "Write" */

}

.delete-button {
  background-color: #f44336; /* Red for "Delete" */
}

.write-button:hover,
.delete-button:hover {
  opacity: 0.8; /* Slight opacity change on hover */
}


@media (max-width: 1199px) { /* 1200px 미만 */
  .book-item {
    width: 90%;
  }

  .book-item p {
    /* outline: 1px solid blue; */
    margin: 0 4px;
  }
  .book-index, .book-count {
    width: 2%; 
  }
  .book-title {
    font-size: 14px;
    width: 45%;
  }

  .book-email {
    width: 20%;
  }
  .book-created-at {
    width: 20%;
  }
}
</style>
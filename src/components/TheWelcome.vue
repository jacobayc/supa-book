<template>
  <div class="main-list">
    <div class="info">
      <p v-if="user"> welcome {{ user.name }}</p>
    </div>
    <div v-if="bookStore.loading">Loading...</div>
    <div v-if="bookStore.error">Error: {{ bookStore.error.message }}</div>
    <ul v-if="bookStore.books.length" class="book-list">
      <li v-for="(book, index) in bookStore.books" :key="book.id" class="book-item" @click="handleBookClick(book)">
        <p>{{ index }}</p>
        <p>{{ book.title }}</p>
        <p>{{ book.count_num }}</p>
        <p>{{ book.created_at }}</p>
        <button v-show="showTrashBin" @click.stop="deleteBook(book.id)">Delete</button>
      </li>
    </ul>
    <p class="empty" v-else-if="!bookStore.loading && !bookStore.error">No books found.</p>
    <div class="tools">
      <button class="write-button" @click="showModal = true">Write</button>
      <button class="delete-button" @click="showTrashBin = !showTrashBin">Delete</button>
    </div>
    <Modal class="modal" v-if="showModal" @close="showModal = false">
        <input type="text" v-model="newBook.title" placeholder="title"/>
        <textarea v-model="newBook.text" placeholder="text" rows="15"/>
        <button @click="saveBook">save</button>
        <button @click="showModal = false">close</button>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useBookStore } from '../stores/book';
import { useRouter } from 'vue-router';
import { supabase } from '../utils/supabaseClient';

const router = useRouter();
const authStore = useAuthStore();
const bookStore = useBookStore();
const user = ref(null);
const newBook = ref({ title: '', text: '' });
const showModal = ref(false);
const showTrashBin = ref(false);

onMounted(async () => {
  await authStore.checkSession();
  user.value = authStore.user; 
  bookStore.fetchBooks(); // 컴포넌트 마운트 시 책 데이터 가져오기
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
    newBook.value = { title: '', text: '' };
    showModal.value = false;
};

const deleteBook = async (bookId) => {
  if (confirm('Are you sure you want to delete this book?')) {
    try {
      await bookStore.deleteBook(bookId); // Use the book ID for deletion
      // Optionally, filter out the deleted book from the local state
      bookStore.books = bookStore.books.filter((book) => book.id !== bookId);
    } catch (error) {
      console.error('Error deleting book:', error);
      // Handle deletion errors appropriately (e.g., display an error message)
    }
  }
};


</script>

<style scoped>
.main-list {
  position: relative;
  width: 100%;
  padding: 40px 0;
}

.info {
  width: fit-content;
  height: 40px;
  margin: 0 auto;
}

.book-list { /* New class for the list */
  width: 100%;
  max-width: 1200px;
  list-style: none; /* Remove default bullet points */
  padding: 0;
  margin: 0 auto;
}

.book-item { /* New class for list items */
  display: flex; /* Arrange items horizontally */
  align-items: center; /* Vertically align content within items */
  padding: 10px 20px; /* Add some padding */
  border-bottom: 1px solid #ddd; /* Add a subtle border between items */
  cursor: pointer; /* Make items clickable (optional) */
}

.book-item p { /* Styles for paragraphs within list items */
  margin: 0 10px; /* Add some space between paragraphs */
  flex: 1; /* Distribute remaining space equally */
}

.book-item p:first-child { /* Style the first paragraph (book ID) */
  font-weight: bold;
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
  top: 40px;
  right: 40px;
  width: 170px;
  justify-content: space-between;
}

.tools button {
  height: 40px;
  min-width: 80px;
  outline: none;
  border: none;
  color: white;
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

.modal {
  position: fixed; /* Make modal fixed on screen */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Center the modal */
  background-color: #fff; /* White background */
  border: 1px solid #ddd; /* Light border */
  border-radius: 5px; /* Rounded corners */
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
  width: 400px; /* Set modal width */

  /* Pink and purple gradient */
  background-image: linear-gradient(to right, #f7cac9, #e5b7b5);
}

.modal input,
.modal textarea,
.modal button {
  resize: none;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
  width: 100%; /* Make inputs and buttons full width */
}
</style>
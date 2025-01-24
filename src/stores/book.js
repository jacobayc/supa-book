import { defineStore } from 'pinia';
import { supabase } from '../utils/supabaseClient';

export const useBookStore = defineStore('book', {
    state: () => ({
        books: [],
        currentBook: null, // 현재 선택된 책 상태 추가
        loading: false, // 데이터 로딩 상태 추가
        error: null,    // 에러 상태 추가
    }),
    actions: {
        // book 저장
      async saveBook(newBook) {
        console.log('save')
        this.loading = true;
        this.error = null;
        try {
            const { data, error } = await supabase.from('books').insert(newBook).select();
            await supabase.from('logs').insert(newBook).select();
            if (error) {
                throw error;
            }
            // 성공적으로 저장되었으면, 로컬 상태 업데이트 (선택적)
            this.books.unshift(data[0]); // 최신글이 위로
        } catch (error) {
            console.error('Error saving book:', error);
            this.error = error;
        } finally {
            this.loading = false;
        }
      },

      // book 삭제
      async deleteBook(bookId) {
        console.log('delete')
        this.loading = true;
        this.error = null;
        try {
            const { error } = await supabase.from('books').delete().eq('id', bookId);
            if (error) {
                throw error;
            }
            this.books = this.books.filter(book => book.id !== bookId); // 로컬 상태 업데이트
        } catch (error) {
            console.error('Error deleting book:', error);
            this.error = error
        } finally {
            this.loading = false;
        }
      },

      async fetchBooks() {
        console.log('fetch')
        this.loading = true; // 로딩 시작
        this.error = null; // 에러 초기화
        try {
            const { data, error } = await supabase
                .from('books') // 테이블 명시적으로 지정
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }
            this.books = data.map(book => {
              const createdAt = new Date(book.created_at);
              const year = createdAt.getFullYear();
              const month = String(createdAt.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 1을 더함
              const day = String(createdAt.getDate()).padStart(2, '0');
              const hours = String(createdAt.getHours()).padStart(2, '0');
              const minutes = String(createdAt.getMinutes()).padStart(2, '0');

              const formattedCreatedAt = `${year}.${month}.${day}.${hours}:${minutes}`;
              
              return { ...book, formattedCreatedAt };
          }) || []; // data가 null일 경우 빈 배열 할당
        } catch (error) {
            console.error('Error fetching books:', error);
            this.error = error; // 에러 상태 업데이트
        } finally {
            this.loading = false; // 로딩 완료
        }
      },

    // 특정 ID의 책 조회 메서드 추가
    async fetchBookById(bookId) {
      console.log('filter')
      this.loading = true;
      this.error = null;
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', bookId)
                .single(); // 단일 레코드 반환

            if (error) {
                throw error;
            }

            // 날짜 포맷팅 로직 추가
            const createdAt = new Date(data.created_at);
            const formattedCreatedAt = `${createdAt.getFullYear()}.${
                String(createdAt.getMonth() + 1).padStart(2, '0')
            }.${String(createdAt.getDate()).padStart(2, '0')}.${
                String(createdAt.getHours()).padStart(2, '0')
            }.${String(createdAt.getMinutes()).padStart(2, '0')}`;

            this.currentBook = { 
                ...data, 
                formattedCreatedAt 
            };

            return this.currentBook;
        } catch (error) {
            console.error('Error fetching book:', error);
            this.error = error;
            return null;
        } finally {
            this.loading = false;
        }
      },

      // 기존 코드에 updateBook 메서드 추가
      async updateBook(updatedBook) {
        this.loading = true
        this.error = null
        try {
          const { data, error } = await supabase
            .from('books')
            .update({ 
              title: updatedBook.title, 
              text: updatedBook.text 
            })
            .eq('id', updatedBook.id)
            .select()

          if (error) {
            throw error
          }

          // 로컬 상태 업데이트
          const index = this.books.findIndex(book => book.id === updatedBook.id)
          if (index !== -1) {
            this.books[index] = { ...this.books[index], ...data[0] }
          }
        } catch (error) {
          console.error('책 업데이트 중 오류:', error)
          this.error = error
        } finally {
          this.loading = false
        }
      }
    }
});
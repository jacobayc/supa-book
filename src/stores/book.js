import { defineStore } from 'pinia';
import { supabase } from '../utils/supabaseClient';

export const useBookStore = defineStore('book', {
    state: () => ({
        books: [],
        loading: false, // 데이터 로딩 상태 추가
        error: null,    // 에러 상태 추가
    }),
    actions: {
        async fetchBooks() {
            this.loading = true; // 로딩 시작
            this.error = null; // 에러 초기화
            try {
                const { data, error } = await supabase
                    .from('books') // 테이블 명시적으로 지정
                    .select('*')
                    .order('created_at', { ascending: false }); // 최신글이 위로

                if (error) {
                    throw error;
                }
                this.books = data.map(book => {
                  const createdAt = new Date(book.created_at);
                  const formattedCreatedAt = `${createdAt.getFullYear()}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')}.${String(createdAt.getHours()).padStart(2, '0')}.${String(createdAt.getMinutes()).padStart(2, '0')}`;
                  return { ...book, formattedCreatedAt };
              }) || []; // data가 null일 경우 빈 배열 할당
            } catch (error) {
                console.error('Error fetching books:', error);
                this.error = error; // 에러 상태 업데이트
            } finally {
                this.loading = false; // 로딩 완료
            }
        },
        async saveBook(newBook) {
            this.loading = true;
            this.error = null;
            try {
                const { data, error } = await supabase.from('books').insert(newBook).select();
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
        async deleteBook(bookId) {
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
        }
    },
});
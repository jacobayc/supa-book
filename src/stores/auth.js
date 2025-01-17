// stores/auth.js
import { defineStore } from 'pinia';
import { supabase } from '../utils/supabaseClient';


export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false,
    user: null, // 추가: 사용자 정보 저장
  }),
  actions: {
    async checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      this.isLoggedIn = !!session; // 세션이 있으면 true, 없으면 false
      this.user = session?.user.user_metadata || null; // 사용자 정보 저장
    },
    async signInWithEmail(email, password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
        this.isLoggedIn = true;
        this.user = data.user;
      } catch (error) {
        console.error('로그인 오류:', error);
        throw error; // 오류를 다시 던져 컴포넌트에서 처리하도록 함
      }
    },
    async signUpWithEmail(email, password, name) {
        try {
            const { data, error } = await supabase.auth.signUp({ 
              email, 
              password,
              options: {
                data: {
                  name,
                },
              },
            });
            if (error) {
              throw error;
            }
          } catch (error) {
            console.error('회원가입 오류:', error);
            throw error; // 오류를 다시 던져 컴포넌트에서 처리하도록 함
          }
    },
    async logout() {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('로그아웃 오류:', error);
          alert('로그아웃 중 오류가 발생했습니다.');
          return;
        }
    
        // 로그아웃 성공 후 세션 정보 재확인
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('세션 정보 조회 오류:', sessionError);
          alert('로그아웃 후 세션 정보를 가져오는 중 오류가 발생했습니다.');
        } else if (!data.session) {
          this.isLoggedIn = false
          this.user = null;
          console.log('log out');

          // alert('로그아웃되었습니다.');
        } else {
          this.isLoggedIn = false
          this.user = null;
          console.error('로그아웃 실패: 세션이 존재합니다.');
        }
      } catch (error) {
        console.error('로그아웃 중 예상치 못한 오류 발생:', error);
        this.isLoggedIn = false
        this.user = null;
        alert('로그아웃 중 예상치 못한 오류가 발생했습니다.');
      }
    }
  },
});
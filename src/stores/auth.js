// stores/auth.js
import { defineStore } from 'pinia';
import { supabase } from '../utils/supabaseClient';


export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false,
    user: null, // 추가: 사용자 정보 저장
  }),
  actions: {
    //프로필 이미지 업로드
    async uploadProfileImage(file) {
      try {
        if (!this.user?.email) throw new Error('사용자가 로그인되어 있지 않습니다.');
        // 기존 이미지가 있다면 삭제
        if (this.user.avatar_url) {
          const oldPath = this.user.avatar_url.split('avatars/')[1];
          if (oldPath) {
            await supabase.storage
              .from('avatars')
              .remove([oldPath]);
          }
        }
    
        const fileExt = file.name.split('.').pop();
        const fileName = `${this.user.email}/${Date.now()}.${fileExt}`;
    
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            upsert: true
          });
    
        if (error) throw error;
    
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
    
        // 사용자 메타데이터 업데이트
        await supabase.auth.updateUser({
          data: { avatar_url: publicUrl }
        });
    
        return publicUrl;
      } catch (error) {
        console.error('프로필 업로드 실패(1MB 이하 가능)', error);
        throw error;
      }
    },
    

    async getProfileImage() {
      try {
        if (!this.user?.avatar_url) return null;
        return this.user.avatar_url;
      } catch (error) {
        console.error('프로필 이미지 가져오기 오류:', error);
        return null;
      }
    },

    // 세션 체크
    async checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      this.isLoggedIn = !!session; // 세션이 있으면 true, 없으면 false
      this.user = session?.user.user_metadata || null; // 사용자 정보 저장
    },

    //로그인
    async signInWithEmail(email, password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          alert('로그인 실패 다시 확인해 주세요')
          throw error;
        }
        this.isLoggedIn = true;
        this.user = data.user;
      } catch (error) {
        console.error('로그인 오류:', error);
        throw error; // 오류를 다시 던져 컴포넌트에서 처리하도록 함
      }
    },
    // 회원가입
    async signUpWithEmail(email, password, name, nickname) {
        try { 
            const { data, error } = await supabase.auth.signUp({ 
              email, 
              password,
              options: {
                data: {
                  name,
                  nickname
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

    // 업데이트 프로필 
    async updateUserNickname(newNickname) {
      try {
        // 현재 사용자의 메타데이터 업데이트
        const { data, error } = await supabase.auth.updateUser({
          data: { 
            nickname: newNickname 
          }
        });
    
        if (error) {
          throw error;
        }
    
        // 로컬 상태도 업데이트
        this.user = newNickname;

        // 성공 알림
        alert('닉네임이 성공적으로 변경되었습니다.');
      } catch (error) {
        console.error('닉네임 변경 오류:', error);
        alert('닉네임 변경 중 오류가 발생했습니다.');
      }
    },
    
    // 로그아웃
    async logout() {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('로그아웃 오류:', error);
          const authKeys = Object.keys(localStorage).filter(key => key.includes("auth-token"));
          localStorage.removeItem(authKeys);
          alert('다른 곳에서 로그아웃 되었습니다.');
          window.location.reload();
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
          this.router.push('/')
          console.log('log out');

          // alert('로그아웃되었습니다.');
        } else {
          this.isLoggedIn = false
          this.user = null;
          this.router.push('/')
          console.error('로그아웃 실패: 세션이 존재합니다.');
        }
      } catch (error) {
        console.error('로그아웃 중 예상치 못한 오류 발생:', error);
        this.router.push('/')
        alert('로그아웃 중 예상치 못한 오류가 발생했습니다.');
      }
    }
  },
});
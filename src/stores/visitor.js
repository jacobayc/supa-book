import { defineStore } from 'pinia'
import { supabase } from '../utils/supabaseClient';
import { useAuthStore } from './auth'

export const useVisitorStore = defineStore('visitor', {
  state: () => ({
    loading: false,
    error: null
  }),

  actions: {
    async saveVisitor() {
      const authStore = useAuthStore()
      
      try {
        // 오늘 날짜의 방문 기록 확인
        const { data: existingVisit, error: checkError } = await supabase
          .from('visitor')
          .select('*')
          .eq('email', authStore.user?.email)
          .gte('visited_at', new Date().toISOString().split('T')[0]) // 오늘 날짜 이후
          .limit(1)
    
        // 이미 오늘 방문 기록이 있거나 비로그인자의 경우 저장하지 않음
        if (existingVisit && existingVisit.length > 0 || authStore.user?.email == undefined) {
          return null
        }
    
        const visitorData = {
          name: authStore.user?.name,
          nickname: authStore.user?.nickname || '',
          email: authStore.user?.email,
          visited_at: new Date().toISOString()
        }
    
        const { data, error } = await supabase
          .from('visitor')
          .insert(visitorData)
    
        if (error) {
          throw error
        }
    
        return data
      } catch (error) {
        console.error(error)
        throw error
      }
    }
    
  }
})

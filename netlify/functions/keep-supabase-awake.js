import { supabaseNetlify as supabase } from './supabaseClientNetlify.js';

exports.handler = async (event) => {
  try {
    console.log('Supabase fetchBooks API 호출 시도 (기존 supabaseClient 사용)...');

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(1); // 최소한의 데이터만 가져오도록 limit 설정
    
    if (error) {
      console.error('Supabase fetchBooks API 호출 실패 (기존 supabaseClient):', error.message);
      return { statusCode: 500, body: `Supabase API call failed (existing supabaseClient): ${error.message}` };
    }

    console.log('Supabase fetchBooks API 호출 성공 (기존 supabaseClient):', data ? data.length : 0, '개의 책 데이터 확인');

    return { statusCode: 200, body: 'Supabase API call successful (existing supabaseClient)' };

  } catch (error) {
    console.error('함수 실행 중 오류:', error);
    return { statusCode: 500, body: `Error during function execution: ${error.message}` };
  }
};
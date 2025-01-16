// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // .env 파일에서 URL 가져오기
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // .env 파일에서 Key 가져오기


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
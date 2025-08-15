const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// 임시로 Supabase 연결을 비활성화 (테스트용)
let supabase = null;

if (supabaseUrl && supabaseKey && 
    !supabaseUrl.includes('your_supabase_url_here') && 
    !supabaseKey.includes('your_supabase_anon_key_here')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 연결 성공');
  } catch (error) {
    console.warn('⚠️ Supabase 연결 실패:', error.message);
    supabase = null;
  }
} else {
  console.warn('⚠️ Supabase 설정이 필요합니다. .env 파일을 확인해주세요.');
  supabase = null;
}

// Clerk와 Supabase 연동을 위한 헬퍼 함수
const getSupabaseWithAuth = (clerkToken) => {
  if (!supabase || !clerkToken) return null;
  
  // Clerk JWT 토큰을 Supabase에 전달
  return supabase.auth.setSession({
    access_token: clerkToken,
    refresh_token: null
  });
};

// 사용자별 데이터 접근을 위한 헬퍼 함수
const getUserSupabase = (clerkUser) => {
  if (!supabase || !clerkUser) return null;
  
  // Clerk 사용자 ID를 Supabase RLS에서 사용
  return supabase.auth.setUser({
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress,
    user_metadata: {
      clerk_user_id: clerkUser.id
    }
  });
};

module.exports = { 
  supabase, 
  getSupabaseWithAuth, 
  getUserSupabase 
}; 
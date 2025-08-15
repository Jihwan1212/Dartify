const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Supabase 설정 확인 중...');
console.log('📋 SUPABASE_URL 존재:', !!supabaseUrl);
console.log('📋 SUPABASE_ANON_KEY 존재:', !!supabaseKey);

// 임시로 Supabase 연결을 비활성화 (테스트용)
let supabase = null;

if (supabaseUrl && supabaseKey && 
    !supabaseUrl.includes('your_supabase_url_here') && 
    !supabaseKey.includes('your_supabase_anon_key_here')) {
  try {
    console.log('🔗 Supabase 클라이언트 생성 시도...');
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 연결 성공');
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error.message);
    console.error('❌ 오류 스택:', error.stack);
    supabase = null;
  }
} else {
  console.warn('⚠️ Supabase 설정이 필요합니다. .env 파일을 확인해주세요.');
  console.warn('📋 SUPABASE_URL:', supabaseUrl);
  console.warn('📋 SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '설정되지 않음');
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
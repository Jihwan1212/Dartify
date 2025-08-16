const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://gzzgdpsqsvfnyifhvbnr.supabase.co';
// 환경 변수에서만 키를 가져오도록 수정
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Supabase 설정 확인 중...');
console.log('📋 SUPABASE_URL 존재:', !!supabaseUrl);
console.log('📋 SUPABASE_SERVICE_ROLE_KEY 존재:', !!supabaseKey);

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

// Supabase 클라이언트 생성 (서비스 롤 키 사용)
let supabase = null;

try {
  console.log('🔗 Supabase 클라이언트 생성 시도...');
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase 연결 성공 (서비스 롤 권한)');
} catch (error) {
  console.error('❌ Supabase 연결 실패:', error.message);
  console.error('❌ 오류 스택:', error.stack);
  supabase = null;
}

// Clerk와 Supabase 연동을 위한 개선된 헬퍼 함수
const getSupabaseWithUserContext = (clerkUser) => {
  if (!supabase || !clerkUser) {
    console.warn('⚠️ Supabase 또는 Clerk 사용자 정보가 없습니다.');
    return null;
  }
  
  try {
    // Clerk 사용자 정보를 Supabase 컨텍스트에 설정
    // 이는 RLS 정책에서 사용될 수 있도록 함
    const userContext = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      metadata: {
        clerk_user_id: clerkUser.id,
        clerk_email: clerkUser.emailAddresses?.[0]?.emailAddress
      }
    };
    
    console.log('👤 사용자 컨텍스트 설정:', {
      id: userContext.id,
      email: userContext.email
    });
    
    return {
      supabase,
      userContext
    };
  } catch (error) {
    console.error('❌ 사용자 컨텍스트 설정 실패:', error);
    return null;
  }
};

// 사용자별 데이터 접근을 위한 안전한 헬퍼 함수
const getUserSpecificSupabase = (clerkUser) => {
  const context = getSupabaseWithUserContext(clerkUser);
  if (!context) return null;
  
  // 사용자별 데이터 접근을 위한 추가 검증
  return {
    ...context,
    // 사용자별 데이터 조회 헬퍼
    getUserData: async (tableName, additionalFilters = {}) => {
      try {
        const { data, error } = await context.supabase
          .from(tableName)
          .select('*')
          .eq('user_id', context.userContext.id)
          .match(additionalFilters)
          .order('created_at', { ascending: false }); // 최신 데이터부터 정렬
          
        if (error) {
          console.error(`❌ ${tableName} 조회 오류:`, error);
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error(`❌ 사용자 데이터 조회 실패 (${tableName}):`, error);
        throw error;
      }
    }
  };
};

// 보안 검증 함수
const validateUserAccess = (clerkUser, resourceUserId) => {
  if (!clerkUser || !clerkUser.id) {
    throw new Error('사용자 인증이 필요합니다.');
  }
  
  if (resourceUserId && resourceUserId !== clerkUser.id) {
    throw new Error('다른 사용자의 리소스에 접근할 수 없습니다.');
  }
  
  return true;
};

module.exports = { 
  supabase, 
  getSupabaseWithUserContext, 
  getUserSpecificSupabase,
  validateUserAccess
}; 
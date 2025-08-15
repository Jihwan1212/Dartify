// 중앙화된 에러 처리 유틸리티
class ErrorHandler {
  // 데이터베이스 에러 처리
  static handleDatabaseError(error, operation = '데이터베이스 작업') {
    console.error(`❌ ${operation} 실패:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });

    // PostgreSQL 에러 코드별 처리
    switch (error.code) {
      case '23505': // unique_violation
        return {
          status: 409,
          message: '중복된 데이터가 존재합니다.',
          error: 'DUPLICATE_ENTRY'
        };
      case '23503': // foreign_key_violation
        return {
          status: 400,
          message: '참조하는 데이터가 존재하지 않습니다.',
          error: 'FOREIGN_KEY_VIOLATION'
        };
      case '23502': // not_null_violation
        return {
          status: 400,
          message: '필수 필드가 누락되었습니다.',
          error: 'NULL_VIOLATION'
        };
      case '42P01': // undefined_table
        return {
          status: 500,
          message: '테이블이 존재하지 않습니다.',
          error: 'TABLE_NOT_FOUND'
        };
      case '42703': // undefined_column
        return {
          status: 500,
          message: '컬럼이 존재하지 않습니다.',
          error: 'COLUMN_NOT_FOUND'
        };
      default:
        return {
          status: 500,
          message: '데이터베이스 오류가 발생했습니다.',
          error: 'DATABASE_ERROR'
        };
    }
  }

  // 인증 에러 처리
  static handleAuthError(error, operation = '인증') {
    console.error(`❌ ${operation} 실패:`, {
      message: error.message,
      stack: error.stack
    });

    return {
      status: 401,
      message: error.message || '인증이 필요합니다.',
      error: 'AUTHENTICATION_ERROR'
    };
  }

  // 권한 에러 처리
  static handlePermissionError(error, operation = '권한 확인') {
    console.error(`❌ ${operation} 실패:`, {
      message: error.message,
      stack: error.stack
    });

    return {
      status: 403,
      message: error.message || '접근 권한이 없습니다.',
      error: 'PERMISSION_ERROR'
    };
  }

  // 파일 처리 에러
  static handleFileError(error, operation = '파일 처리') {
    console.error(`❌ ${operation} 실패:`, {
      message: error.message,
      stack: error.stack
    });

    return {
      status: 400,
      message: error.message || '파일 처리 중 오류가 발생했습니다.',
      error: 'FILE_ERROR'
    };
  }

  // OpenAI API 에러 처리
  static handleOpenAIError(error, operation = 'OpenAI API 호출') {
    console.error(`❌ ${operation} 실패:`, {
      message: error.message,
      status: error.status,
      stack: error.stack
    });

    if (error.status === 429) {
      return {
        status: 429,
        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        error: 'RATE_LIMIT_EXCEEDED'
      };
    }

    if (error.status === 401) {
      return {
        status: 500,
        message: 'OpenAI API 키가 유효하지 않습니다.',
        error: 'INVALID_API_KEY'
      };
    }

    return {
      status: 500,
      message: 'AI 분석 중 오류가 발생했습니다.',
      error: 'OPENAI_ERROR'
    };
  }

  // 일반 에러 처리
  static handleGeneralError(error, operation = '작업') {
    console.error(`❌ ${operation} 실패:`, {
      message: error.message,
      stack: error.stack
    });

    return {
      status: 500,
      message: '서버 오류가 발생했습니다.',
      error: 'INTERNAL_ERROR'
    };
  }

  // 응답 생성
  static createErrorResponse(error, operation = '작업') {
    let errorInfo;

    if (error.code && error.code.startsWith('23')) {
      // PostgreSQL 에러
      errorInfo = this.handleDatabaseError(error, operation);
    } else if (error.message && error.message.includes('인증')) {
      // 인증 에러
      errorInfo = this.handleAuthError(error, operation);
    } else if (error.message && error.message.includes('권한')) {
      // 권한 에러
      errorInfo = this.handlePermissionError(error, operation);
    } else if (error.message && error.message.includes('파일')) {
      // 파일 에러
      errorInfo = this.handleFileError(error, operation);
    } else if (error.status && (error.status === 429 || error.status === 401)) {
      // OpenAI API 에러
      errorInfo = this.handleOpenAIError(error, operation);
    } else {
      // 일반 에러
      errorInfo = this.handleGeneralError(error, operation);
    }

    return {
      success: false,
      message: errorInfo.message,
      error: errorInfo.error,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ErrorHandler;

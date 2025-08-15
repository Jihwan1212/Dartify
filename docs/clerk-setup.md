# Clerk 인증 설정 가이드

Dartify 프로젝트에 Clerk 인증 시스템을 설정하는 방법을 안내합니다.

## 1. Clerk 계정 생성 및 애플리케이션 설정

### 1.1 Clerk 계정 생성
1. [Clerk Dashboard](https://dashboard.clerk.com/)에 접속
2. 새 계정을 생성하거나 기존 계정으로 로그인

### 1.2 새 애플리케이션 생성
1. Dashboard에서 **"Add application"** 클릭
2. 애플리케이션 이름을 "Dartify"로 설정
3. **"Create application"** 클릭

### 1.3 API 키 확인
1. 왼쪽 메뉴에서 **"API Keys"** 선택
2. **Publishable Key**를 복사 (예: `pk_test_...`)

## 2. 프로젝트 설정

### 2.1 HTML 파일 수정
`public/index.html` 파일에서 Clerk 스크립트의 Publishable Key를 실제 키로 교체:

```html
<script
    async
    crossorigin="anonymous"
    data-clerk-publishable-key="pk_test_YOUR_ACTUAL_KEY_HERE"
    src="https://clerk.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
    type="text/javascript"
></script>
```

### 2.2 환경 변수 설정 (선택사항)
`.env` 파일에 Clerk 키를 추가:

```env
CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

## 3. Clerk 기능 설정

### 3.1 인증 방법 설정
1. Clerk Dashboard에서 **"User & Authentication"** → **"Email, Phone, Username"** 선택
2. 원하는 인증 방법 활성화:
   - **Email**: 이메일/비밀번호 로그인
   - **Phone**: 전화번호 인증
   - **Username**: 사용자명 로그인

### 3.2 소셜 로그인 설정 (선택사항)
1. **"Social Connections"** 선택
2. 원하는 소셜 로그인 활성화:
   - Google
   - GitHub
   - Apple
   - 기타

### 3.3 사용자 프로필 설정
1. **"User Profile"** 선택
2. 필요한 필드 추가:
   - First Name
   - Last Name
   - Company
   - Role

## 4. 보안 설정

### 4.1 세션 관리
1. **"Sessions"** 설정에서 세션 시간 조정
2. 기본값: 30일 (필요에 따라 조정)

### 4.2 보안 정책
1. **"Security"** 설정에서:
   - 비밀번호 정책 설정
   - 2FA (Two-Factor Authentication) 활성화
   - 로그인 시도 제한 설정

## 5. 테스트

### 5.1 로컬 테스트
1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 우측 상단의 로그인/회원가입 버튼 확인
4. 인증 플로우 테스트

### 5.2 프로덕션 배포
1. 프로덕션 환경에서 Clerk Dashboard의 **"Domains"** 설정
2. 실제 도메인 추가 (예: `https://yourdomain.com`)
3. HTTPS 설정 확인

## 6. 커스터마이징

### 6.1 UI 커스터마이징
Clerk 컴포넌트의 스타일을 커스터마이징하려면:

```css
/* Clerk 컴포넌트 스타일 오버라이드 */
.cl-userButton-root {
    /* 사용자 버튼 스타일 */
}

.cl-signIn-root {
    /* 로그인 폼 스타일 */
}
```

### 6.2 다국어 지원
1. **"Localization"** 설정에서 한국어 추가
2. 번역 텍스트 커스터마이징

## 7. 문제 해결

### 7.1 일반적인 문제들

**문제**: Clerk가 로드되지 않음
- **해결**: Publishable Key가 올바른지 확인
- **해결**: 네트워크 연결 확인

**문제**: 로그인 후 UI가 업데이트되지 않음
- **해결**: JavaScript 콘솔에서 오류 확인
- **해결**: `updateAuthUI()` 함수 호출 확인

**문제**: CORS 오류
- **해결**: Clerk Dashboard에서 도메인 설정 확인
- **해결**: 개발 환경에서는 `localhost` 추가

### 7.2 디버깅
브라우저 개발자 도구에서:
1. **Console** 탭에서 Clerk 관련 오류 확인
2. **Network** 탭에서 API 호출 상태 확인
3. **Application** 탭에서 세션 정보 확인

## 8. 추가 리소스

- [Clerk 공식 문서](https://clerk.com/docs)
- [JavaScript SDK 가이드](https://clerk.com/docs/quickstarts/javascript)
- [컴포넌트 커스터마이징](https://clerk.com/docs/components/overview)
- [API 레퍼런스](https://clerk.com/docs/references/javascript/overview)

## 9. 보안 모범 사례

1. **환경 변수 사용**: API 키를 코드에 하드코딩하지 마세요
2. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS 사용
3. **도메인 제한**: 허용된 도메인만 설정
4. **정기 업데이트**: Clerk SDK를 최신 버전으로 유지
5. **모니터링**: Clerk Dashboard에서 사용자 활동 모니터링

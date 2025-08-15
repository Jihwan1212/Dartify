# Dartify - 공시 분석 자동화 플랫폼

**Dartify**는 기업의 전자공시(DART) 자료를 업로드하면 자동으로 분석하여 인사이트를 제공하는 공시 분석 자동화 플랫폼입니다.

## 🚀 Railway 배포 가이드

### 1. 사전 준비사항

- GitHub 계정
- Railway 계정 (https://railway.app)
- OpenAI API 키
- Supabase 프로젝트
- Clerk 인증 설정

### 2. 환경변수 설정

Railway 대시보드에서 다음 환경변수를 설정하세요:

```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CORS_ORIGIN=https://your-app-name.railway.app
```

### 3. 배포 단계

1. GitHub에 코드 푸시
2. Railway 대시보드에서 "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. Dartify 저장소 선택
5. 환경변수 설정
6. 배포 완료 후 도메인 확인

### 4. 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start
```

## 📁 프로젝트 구조

```
Dartify/
├── src/
│   ├── app.js              # Express 서버 메인 파일
│   ├── routes/             # API 라우트
│   ├── controllers/        # 컨트롤러
│   ├── services/           # 비즈니스 로직
│   └── config/            # 설정 파일
├── public/                # 정적 파일
├── docs/                  # 문서
└── uploads/               # 업로드 파일 저장소
```

## 🔧 기술 스택

- **Backend**: Node.js, Express
- **Database**: Supabase
- **Authentication**: Clerk
- **AI**: OpenAI API
- **File Processing**: PDF-parse, Multer

## �� 라이선스

ISC License

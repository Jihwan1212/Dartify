# Dartify

**Dartify**는 기업의 전자공시(DART) 자료를 업로드하면 자동으로 분석하여 인사이트를 제공하는 공시 분석 자동화 플랫폼입니다.

## 🚀 배포 (Render)

### 배포 단계:

1. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **Render 계정 생성 및 서비스 연결**
   - [Render.com](https://render.com)에서 계정 생성
   - "New Web Service" 선택
   - GitHub 저장소 연결

3. **환경변수 설정**
   Render 대시보드에서 다음 환경변수들을 설정:
   - `OPENAI_API_KEY`: OpenAI API 키
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_ANON_KEY`: Supabase 익명 키
   - `CLERK_PUBLISHABLE_KEY`: Clerk 퍼블릭 키
   - `CORS_ORIGIN`: 프론트엔드 도메인 (예: https://your-app.vercel.app)

4. **배포 설정**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

### 배포 후 확인사항:
- API 엔드포인트: `https://your-app-name.onrender.com`
- 정적 파일: `https://your-app-name.onrender.com/`

## 🛠️ 로컬 개발

### 설치
```bash
npm install
```

### 환경변수 설정
```bash
cp env.example .env
# .env 파일을 편집하여 실제 값들을 입력
```

### 실행
```bash
npm run dev
```

## 📁 프로젝트 구조

```
Dartify/
├── src/                    # 서버 소스 코드
│   ├── app.js             # Express 앱 메인 파일
│   ├── routes/            # API 라우트
│   ├── controllers/       # 컨트롤러
│   ├── services/          # 비즈니스 로직
│   └── config/            # 설정 파일
├── public/                # 정적 파일 (프론트엔드)
├── uploads/               # 업로드된 파일 저장소
├── docs/                  # 프로젝트 문서
└── package.json           # 프로젝트 설정
```

## 🔧 기술 스택

- **Backend**: Node.js, Express
- **Database**: Supabase
- **Authentication**: Clerk
- **AI**: OpenAI API
- **File Processing**: PDF parsing
- **Frontend**: HTML, CSS, JavaScript

## 📝 API 엔드포인트

- `POST /api/analysis/upload` - PDF 파일 업로드 및 분석
- `GET /api/config/settings` - 설정 정보 조회
- `GET /` - 메인 페이지

## 🔒 보안

- CORS 설정으로 허용된 도메인만 접근 가능
- 파일 업로드 크기 제한 (10MB)
- 환경변수를 통한 민감한 정보 관리

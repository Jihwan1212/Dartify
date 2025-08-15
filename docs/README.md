# Dartify

**Dartify**는 기업의 전자공시(DART) 자료를 업로드하면 자동으로 분석하여 인사이트를 제공하는 공시 분석 자동화 플랫폼입니다.  
투자자, 애널리스트, 기업 담당자 누구나 쉽고 빠르게 공시 내용을 이해하고 활용할 수 있도록 설계되었습니다.

---

## 🚀 Dartify 주요 기능

### 📊 공시 분석
- **공시 유형 선택**: 공시 세부 유형을 이용자가 분석 전에 드롭다운을 통해 선택
- **맞춤형 분석**: 공시 세부 유형별 최적화된 프롬프트를 활용해 업로드한 PDF 파일 파싱한 뒤 AI기반으로 분석 실행
- **실시간 처리**: 업로드 즉시 AI 기반 분석 수행
- **깔끔한 결과 UI**: 구조화되고 MECE한 분석결과가 트렌디하고 가독성 좋게 노션과 같은 형식으로 시각화되어 산출
- **주의사항**: 이용자가 분석결과를 확인할 때 #과 * 등 마크다운 문법이 보이면 가독성이 매우 떨어짐.

### 🔍 강화된 PDF 처리
- **OCR 기능**: 스캔된 이미지 PDF도 텍스트 추출 가능
- **테이블 데이터 추출**: PDF 내 표 데이터를 구조화하여 분석에 포함
- **보안 PDF 처리**: 보안 설정 확인 및 적절한 오류 메시지 제공
- **다중 언어 지원**: 한국어 + 영어 OCR 인식
- **메타데이터 추출**: PDF 정보 및 페이지 수 자동 감지
- **자동 텍스트 정리**: 불필요한 공백 및 특수문자 정리

### 📈 공시 유형별 분석
- **정기공시**: 사업보고서, 반기보고서, 분기보고서
- **주요사항보고서**: 주식/채무/경영 관련 주요사항
- **발행공시**: 증권신고서, 투자설명서
- **지분공시**: 대량보유상황보고서, 공개매수
- **기타공시**: 합병, 분할, 자산처분 등

### 💡 결과 활용
- **즉시 확인**: 가독성 좋게 시각화된 분석 결과를 실시간으로 확인 가능
- **복사 기능**: 결과를 클립보드에 복사하여 바로 활용
- **내보내기**: 텍스트 파일로 결과 저장 및 공유

### 🎨 사용자 경험
- **드래그 앤 드롭**: 직관적인 파일 업로드
- **트렌디한 로딩 UI**: 단계별 진행 상황을 보여주는 현대적인 로딩 화면
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **실시간 알림**: 작업 상태를 실시간으로 알려주는 알림 시스템

---

## 🛠️ 기술 스택

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI API (GPT-4)
- **File Processing**: pdf-parse, multer
- **Authentication**: Clerk

### Frontend
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 (Grid, Flexbox, Glassmorphism)
- **UI Framework**: Custom Design System
- **Icons**: Font Awesome 6.0

### Development Tools
- **Package Manager**: npm
- **Development Server**: nodemon
- **Environment**: dotenv
- **CORS**: cors

---

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd Dartify
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 정보를 입력하세요:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_PROMPT_ID=pmpt_689321d3b5e48196bb2cf970663b1bd208796189d84781fd

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

### 4. Clerk 인증 설정
1. [Clerk Dashboard](https://dashboard.clerk.com/)에서 새 애플리케이션을 생성하세요
2. **API Keys** 페이지에서 Publishable Key를 복사하세요
3. `public/index.html` 파일의 Clerk 스크립트 태그에서 `data-clerk-publishable-key` 값을 실제 키로 교체하세요
4. 또는 환경 변수 `CLERK_PUBLISHABLE_KEY`를 설정하고 JavaScript에서 동적으로 로드할 수 있습니다

### 5. Supabase 데이터베이스 설정
```sql
-- supabase-setup.sql 파일을 참고하여 데이터베이스 스키마를 설정하세요
```

### 5. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 6. 프롬프트 API 테스트 (선택사항)
```bash
npm run test:prompt
```

---

## 📁 프로젝트 구조

```
Dartify/
├── public/                 # 정적 파일
│   ├── css/               # 스타일시트
│   │   ├── style.css      # 메인 스타일
│   │   └── notion-style.css # 노션 스타일
│   ├── js/                # 클라이언트 JavaScript
│   │   └── app.js         # 메인 앱 로직
│   ├── images/            # 이미지 파일
│   └── index.html         # 메인 HTML
├── src/                   # 서버 소스 코드
│   ├── config/            # 설정 파일
│   │   └── supabase.js    # Supabase 설정
│   ├── controllers/       # 컨트롤러
│   │   └── analysisController.js
│   ├── middleware/        # 미들웨어
│   ├── models/            # 데이터 모델
│   │   └── disclosureTypes.js
│   ├── routes/            # 라우트
│   │   └── analysisRoutes.js
│   ├── services/          # 서비스 레이어
│   │   ├── markdownService.js
│   │   ├── openaiService.js
│   │   └── pdfService.js
│   ├── utils/             # 유틸리티
│   └── app.js             # 메인 서버 파일
├── uploads/               # 업로드된 파일 저장소
├── 주요자료/              # 프로젝트 문서
├── package.json           # 프로젝트 설정
├── supabase-setup.sql     # 데이터베이스 스키마
└── README.md              # 프로젝트 문서
```

---

## 🔧 주요 기능 상세

### PDF 처리 시스템
- **텍스트 추출**: pdf-parse를 사용한 기본 텍스트 추출
- **OCR 지원**: 스캔된 이미지 PDF 처리
- **테이블 인식**: PDF 내 표 데이터 구조화
- **메타데이터**: 파일 정보 자동 추출

### AI 분석 엔진
- **프롬프트 최적화**: 공시 유형별 맞춤형 프롬프트
- **토큰 관리**: 효율적인 API 사용량 관리
- **결과 구조화**: MECE 원칙에 따른 분석 결과

### 사용자 인터페이스
- **모던 디자인**: Glassmorphism과 그라데이션 효과
- **반응형 레이아웃**: 모든 화면 크기 지원
- **애니메이션**: 부드러운 전환 효과
- **접근성**: 키보드 네비게이션 지원

---

## 🚀 배포

### 로컬 개발
```bash
npm run dev
```

### 프로덕션 배포
```bash
npm start
```

### 환경 변수 확인
- 모든 필수 환경 변수가 설정되었는지 확인
- Supabase 연결 상태 확인
- OpenAI API 키 유효성 확인

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 ISC 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

## 🔄 업데이트 로그

### v1.0.0 (2025-01-XX)
- ✅ 초기 프로젝트 설정
- ✅ PDF 업로드 및 텍스트 추출 기능
- ✅ OpenAI API 연동
- ✅ Supabase 데이터베이스 연동
- ✅ 공시 유형별 분석 시스템
- ✅ 트렌디한 UI/UX 디자인
- ✅ 반응형 웹 디자인
- ✅ 실시간 로딩 애니메이션
- ✅ 결과 복사 및 다운로드 기능
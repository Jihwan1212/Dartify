# Dartify 디자인 가이드라인

## 개요

Dartify는 기업의 전자공시(DART) 자료를 AI 기반으로 분석하여 인사이트를 제공하는 공시 분석 자동화 플랫폼입니다. 이 가이드라인은 Dartify의 브랜드 아이덴티티를 일관되게 유지하고, 사용자 경험을 향상시키기 위한 디자인 원칙과 표준을 정의합니다.

---

## 브랜드 아이덴티티

### 브랜드 철학
- **신뢰성**: 정확하고 신뢰할 수 있는 공시 분석 제공
- **효율성**: 복잡한 공시 내용을 빠르고 쉽게 이해할 수 있도록 도움
- **혁신성**: AI 기술을 활용한 차세대 공시 분석 플랫폼
- **접근성**: 투자자, 애널리스트, 기업 담당자 누구나 쉽게 사용 가능

### 브랜드 톤앤매너
- **전문적이면서 친근한**: 복잡한 금융 정보를 쉽게 전달
- **현대적이고 트렌디한**: 최신 디자인 트렌드를 반영
- **명확하고 직관적인**: 사용자가 혼란스럽지 않도록 명확한 정보 전달

---

## 색상 체계

### 주요 브랜드 색상

#### Primary Colors
- **Primary Blue**: `#667eea`
  - 사용: 주요 버튼, 브랜드 로고, 강조 요소
  - 의미: 신뢰, 안정, 전문성

#### Secondary Colors
- **Light Blue**: `#f8f9ff`
  - 사용: 배경, 호버 상태, 부드러운 강조
- **Dark Blue**: `#5a6fd8`
  - 사용: 호버 상태, 활성 상태

#### Neutral Colors
- **Pure White**: `#ffffff`
  - 사용: 배경, 카드 배경
- **Light Gray**: `#f0f0f0`
  - 사용: 구분선, 경계선
- **Medium Gray**: `#666666`
  - 사용: 보조 텍스트, 아이콘
- **Dark Gray**: `#333333`
  - 사용: 주요 텍스트, 제목

#### Status Colors
- **Success Green**: `#10b981`
  - 사용: 성공 상태, 완료 표시
- **Warning Orange**: `#f59e0b`
  - 사용: 경고, 주의사항
- **Error Red**: `#ef4444`
  - 사용: 오류, 실패 상태

### 색상 사용 가이드라인
- Primary Blue는 브랜드 아이덴티티를 나타내는 핵심 색상으로 사용
- 배경색은 순수한 흰색을 기본으로 하되, 필요시 Light Blue 그라데이션 활용
- 텍스트는 가독성을 위해 Dark Gray를 우선 사용
- 상태 표시는 명확한 의미 전달을 위해 Status Colors 활용

---

## 타이포그래피

### 폰트 패밀리
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 폰트 크기 체계

#### 제목 (Headings)
- **H1 (Main Title)**: `2.5rem` (40px) - 메인 페이지 제목
- **H2 (Section Title)**: `1.8rem` (28.8px) - 섹션 제목
- **H3 (Card Title)**: `1.4rem` (22.4px) - 카드 제목
- **H4 (Sub Title)**: `1.2rem` (19.2px) - 부제목

#### 본문 (Body Text)
- **Large Body**: `1.1rem` (17.6px) - 중요 본문
- **Regular Body**: `1rem` (16px) - 기본 본문
- **Small Body**: `0.9rem` (14.4px) - 보조 텍스트
- **Caption**: `0.8rem` (12.8px) - 캡션, 라벨

### 폰트 웨이트
- **Light**: 300 - 부드러운 강조
- **Regular**: 400 - 기본 텍스트
- **Medium**: 500 - 보조 제목
- **Semi-bold**: 600 - 제목, 강조
- **Bold**: 700 - 주요 제목

### 라인 하이트
- **Tight**: 1.1 - 제목
- **Normal**: 1.4 - 본문
- **Relaxed**: 1.6 - 긴 텍스트

---

## 레이아웃 시스템

### 그리드 시스템
- **최대 너비**: 1200px
- **컨테이너 패딩**: 20px (모바일), 40px (데스크톱)
- **컬럼 간격**: 20px
- **반응형 브레이크포인트**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### 스페이싱
- **XS**: 4px - 미세한 간격
- **S**: 8px - 작은 간격
- **M**: 16px - 기본 간격
- **L**: 24px - 큰 간격
- **XL**: 32px - 매우 큰 간격
- **XXL**: 48px - 섹션 간격

### 카드 디자인
- **배경**: 흰색 (`#ffffff`)
- **그림자**: 
  ```css
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  ```
- **테두리 반경**: 12px
- **패딩**: 24px
- **호버 효과**: 
  ```css
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
  ```

---

## 컴포넌트 디자인

### 버튼 (Buttons)

#### Primary Button
```css
.primary-btn {
    background: #667eea;
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    font-weight: 600;
    font-size: 0.9rem;
    border: none;
    transition: all 0.3s ease;
}

.primary-btn:hover {
    background: #5a6fd8;
    transform: translateY(-1px);
}
```

#### Secondary Button
```css
.secondary-btn {
    background: white;
    color: #667eea;
    padding: 10px 20px;
    border-radius: 25px;
    font-weight: 600;
    font-size: 0.9rem;
    border: 2px solid #667eea;
    transition: all 0.3s ease;
}

.secondary-btn:hover {
    background: #f8f9ff;
    transform: translateY(-1px);
}
```

#### Ghost Button
```css
.ghost-btn {
    background: transparent;
    color: #666;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
    border: 1px solid transparent;
    transition: all 0.3s ease;
}

.ghost-btn:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #333;
}
```

### 입력 필드 (Input Fields)

#### 기본 입력 필드
```css
.input-field {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
}

.input-field:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

#### 파일 업로드 영역
```css
.upload-area {
    border: 2px dashed #f0f0f0;
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    transition: all 0.3s ease;
    background: #fafafa;
}

.upload-area:hover {
    border-color: #667eea;
    background: #f8f9ff;
}

.upload-area.dragover {
    border-color: #667eea;
    background: #f8f9ff;
    transform: scale(1.02);
}
```

### 카드 (Cards)

#### 기본 카드
```css
.card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
}
```

#### 결과 카드
```css
.result-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    padding: 14px;
    box-shadow: 
        0 12px 24px rgba(0, 0, 0, 0.08),
        0 4px 8px rgba(0, 0, 0, 0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 로딩 애니메이션

#### 스피너
```css
.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f0f0f0;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

#### 프로그레스 바
```css
.progress-bar {
    width: 100%;
    height: 6px;
    background: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #5a6fd8);
    border-radius: 3px;
    transition: width 0.3s ease;
    animation: shimmer 2s infinite;
}
```

---

## 아이콘 시스템

### 아이콘 라이브러리
- **Font Awesome 6.0** 사용
- **크기**: 16px, 20px, 24px, 32px
- **색상**: 브랜드 색상과 일치

### 주요 아이콘
- **업로드**: `fa-cloud-upload-alt`
- **분석**: `fa-magic`
- **복사**: `fa-copy`
- **다운로드**: `fa-download`
- **로딩**: `fa-spinner`
- **성공**: `fa-check-circle`
- **경고**: `fa-exclamation-triangle`
- **오류**: `fa-times-circle`

---

## 애니메이션 가이드라인

### 전환 효과 (Transitions)
- **기본 전환**: `0.3s ease`
- **빠른 전환**: `0.15s ease`
- **부드러운 전환**: `0.5s cubic-bezier(0.4, 0, 0.2, 1)`

### 호버 효과
- **버튼**: `translateY(-1px)` + 그림자 증가
- **카드**: `translateY(-2px)` + 그림자 증가
- **링크**: 색상 변화 + 밑줄 효과

### 로딩 애니메이션
- **스피너**: 회전 애니메이션
- **프로그레스**: 너비 변화 + shimmer 효과
- **페이드 인**: `opacity` 변화

---

## 반응형 디자인

### 모바일 우선 접근법
- 모바일 디자인을 기본으로 하여 확장
- 터치 친화적인 인터페이스
- 최소 44px 터치 타겟 크기

### 브레이크포인트
```css
/* Mobile */
@media (max-width: 768px) {
    .container { padding: 0 20px; }
    .card { padding: 16px; }
    .main-title { font-size: 2rem; }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
    .container { padding: 0 30px; }
}

/* Desktop */
@media (min-width: 1025px) {
    .container { max-width: 1200px; margin: 0 auto; }
}
```

### 터치 인터랙션
- 터치 피드백 제공
- 스와이프 제스처 지원
- 줌 기능 최적화

---

## 접근성 (Accessibility)

### 색상 대비
- 텍스트와 배경 간 최소 4.5:1 대비 비율
- 색상만으로 정보를 전달하지 않음
- 고대비 모드 지원

### 키보드 네비게이션
- 모든 인터랙티브 요소에 키보드 접근 가능
- 포커스 표시기 명확히 표시
- 논리적인 탭 순서

### 스크린 리더 지원
- 의미있는 HTML 구조
- 적절한 ARIA 라벨
- 대체 텍스트 제공

---

## 성능 최적화

### 이미지 최적화
- WebP 포맷 우선 사용
- 적절한 이미지 크기
- 지연 로딩 적용

### CSS 최적화
- Critical CSS 인라인
- 불필요한 CSS 제거
- CSS 압축

### JavaScript 최적화
- 코드 분할
- 지연 로딩
- 번들 크기 최적화

---

## 브랜드 자산

### 로고 사용 가이드라인
- 최소 크기: 24px 높이
- 클리어스페이스: 로고 높이의 1/2
- 배경: 흰색 또는 밝은 배경 권장

### 색상 변형
- **Primary**: Primary Blue (#667eea)
- **Monochrome**: 검정 또는 흰색
- **Reverse**: 흰색 로고 (어두운 배경용)

---

## 구현 가이드라인

### CSS 클래스 명명 규칙
- **BEM 방법론** 사용
- 예: `.card`, `.card__title`, `.card--featured`

### 컴포넌트 구조
```css
/* 컴포넌트 기본 */
.component {
    /* 기본 스타일 */
}

/* 컴포넌트 요소 */
.component__element {
    /* 요소 스타일 */
}

/* 컴포넌트 변형 */
.component--variant {
    /* 변형 스타일 */
}
```

### CSS 변수 사용
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #5a6fd8;
    --text-color: #333333;
    --background-color: #ffffff;
    --border-radius: 12px;
    --transition: 0.3s ease;
}
```

---

## 품질 보증

### 디자인 리뷰 체크리스트
- [ ] 브랜드 가이드라인 준수
- [ ] 색상 대비 검증
- [ ] 반응형 디자인 테스트
- [ ] 접근성 가이드라인 준수
- [ ] 성능 최적화 확인
- [ ] 크로스 브라우저 호환성 검증

### 테스트 환경
- **브라우저**: Chrome, Firefox, Safari, Edge
- **디바이스**: iOS, Android, Desktop
- **해상도**: 320px ~ 1920px

---

## 업데이트 및 유지보수

### 버전 관리
- 주요 변경사항 문서화
- 호환성 보장
- 점진적 업데이트

### 피드백 수집
- 사용자 피드백 분석
- A/B 테스트 진행
- 지속적인 개선

---

이 가이드라인은 Dartify의 디자인 시스템을 일관되게 유지하고, 사용자 경험을 향상시키기 위한 기준을 제공합니다. 모든 디자인 결정은 이 가이드라인을 참조하여 일관성과 품질을 보장해야 합니다.

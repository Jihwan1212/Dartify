# 공모가 산정 근거 분석 기능 - 작업 인계 (2026-11-12)

## 목적
증권신고서(지분증권)에서 공모가 산정 근거(비교기업, 멀티플, 적용 이익, 주식 수, 주당 평가가액, 할인율, 희망 공모가 밴드, 확정 공모가)를 추출하고,
추출 수치를 원문 대조와 재계산으로 검증한다. 첫 테스트 대상은 신영증권이 대표주관한 쎄크(2025년 상장).

## 지금까지 한 것 (커밋 전)
- src/services/ipoValuationService.js (신규): ① locateSections 규칙 기반 구간 추출 ② extractStructured OpenAI Responses API + json_schema(strict) ③ verify 원문 대조(인용 문장 안의 숫자 확인) + 재계산 ④ toMarkdown
- scripts/ipo-valuation.js (신규): CLI. --section-only(AI 호출 없이 구간만), --data <json>(추출 생략, 검증만)
- src/models/disclosureTypes.js: issuance.types.stockSecuritiesValuation 추가 (mode: 'structured')
- src/controllers/analysisController.js: specificType === 'stockSecuritiesValuation'이면 ipoValuationService로 분기
- 업로드 한도 10MB -> 30MB (routes, app.js, public/js/app.js)
- 가짜 데이터로 verify/toMarkdown 동작만 확인함. 실제 PDF·OpenAI 호출 테스트는 아직 안 함.

## 진행 상황 (2026-11-23 기준)

- 1~2단계: 완료. `[쎄크][정정]투자설명서(2025.04.16).pdf` (전체 746,737자) 사용. `locateSections` 기본값(windowChars 45,000)으로 비교기업 6개사·개별 PER·4단계 선정기준·PER 산정 전체가 자동 추출됨. 코드 수정 없음.
- 3단계(AI 구조화 추출), 1차 시도: OpenAI로 막힘(프로젝트에 모델 접근 권한 전혀 없음, 아래 오류 유형 3번). 수동 전사 JSON으로 verify/toMarkdown 로직만 먼저 검증(아래).
- **AI 추출 엔진을 OpenAI -> Claude API로 교체함(2026-11-23, 사용자 지시).** `src/services/ipoValuationService.js`의 `extractStructured`가 이제 `@anthropic-ai/sdk`의 `client.messages.create` + `output_config: {format: {type:'json_schema', schema: SCHEMA}}`를 사용 (기본 모델 `claude-opus-5`, env는 `ANTHROPIC_API_KEY` / `ANTHROPIC_EXTRACT_MODEL`). 앱의 기존 기능인 `src/services/openaiService.js`(다른 분석 기능용)는 범위 밖이라 건드리지 않음. `package.json`에 `@anthropic-ai/sdk` 추가, `openai`는 다른 기능이 쓰므로 유지.
- 3~4단계: **완료, 전부 일치.** `node scripts/ipo-valuation.js "uploads/[쎄크][정정]투자설명서(2025.04.16).pdf"` 실행 결과:
  - 10개 핵심 수치(적용멀티플 21.52, 적용이익 8,043,101,595원, 주식수 8,825,535주, 주당평가가액 19,612원, 할인율 23.52~33.71%, 밴드 13,000~15,000원, 확정가 15,000원) 전부 "원문 일치(인용 확인)".
  - 비교기업 6개사(티에스이/제이티/엔시스/자비스/기가비스/넥스틴) 이름·멀티플 전부 정확히 추출, "원문에 수치 있음".
  - 재계산 검증 2건(비교기업 PER 산술평균=적용멀티플, 주당평가가액×(1-할인율)≈밴드) 전부 일치.
  - `equity_value_krw`는 문서에 총 시가총액이 명시돼 있지 않아 AI도 null로 정확히 판단(이익×멀티플÷주식수가 아니라 EPS×PER로 바로 주당가치를 구하는 방식이기 때문).
  - **직전에 투자설명서 원문을 직접 읽고 손으로 만든 "정답" JSON과 대조한 결과, 10개 수치 + 비교기업 6개사가 전부 100% 일치함.** 이 1건 테스트 기준으로는 추출 오류 0건.

## 남은 작업 순서
1. 최근 IPO 2~4건으로 같은 파이프라인(투자설명서 PDF 우선 확보 -> --section-only 확인 -> 전체 실행 -> 원문 대조)을 반복 테스트. 쎄크 1건만으로는 "항상 정확하다"고 일반화할 수 없음 — INSTRUCTIONS/스키마가 다른 산업·다른 평가방법(DCF, EV/EBITDA 등)에서도 버티는지가 핵심 검증 대상.
2. 테스트 중 나오는 "확인 필요"·"불일치" 항목은 원인을 기록(추출 오류인지, 문서가 가중평균·조정을 썼는지).
3. 오류 유형을 기록하고 INSTRUCTIONS/스키마/구간 추출을 고친 뒤 재실행.
4. 결과는 다음 단계(A: Excel로 공모가 재현 + 상장 후 실적·주가 비교, B: 2~3장 리포트)의 입력으로 쓴다.

## 오류 유형 기록

1. **문서 선택 오류 - 정정신고서(diff 형식)에는 비교기업 명단이 없을 수 있음**
   - 대상: `[쎄크][정정]증권신고서(지분증권)(2025.04.16).pdf`
   - 증상: locateSections는 정상 동작(공모가 산정 요약표의 적용멀티플 21.52배, 적용이익 8,043백만원, 주식수 8,825,535주, 밴드 13,000~15,000원, 확정 15,000원 전부 구간 안에 포함)했지만, 개별 비교기업(유사회사) 이름·PER·선정기준은 원문 어디에도 없었음.
   - 원인: DART의 "정정신고서"는 전체 본문을 다시 싣지 않고 "(주N) 정정 전/정정 후" 형식으로 **바뀐 문단만** 수록한다. `(4) 유사기업 PER 산정` 섹션은 이번 정정에서 바뀌지 않았으므로 제목만 교차참조로 언급되고 본문은 생략됨. 추출 로직(ANCHORS/windowChars)의 문제가 아니라 입력 문서 자체에 해당 정보가 없는 경우.
   - 조치: 같은 제출일(2025.04.16)의 [기재정정]투자설명서를 추가로 받아 재시도. 투자설명서는 확정 조건이 반영된 전체 문서이므로 비교기업 명단이 포함될 것으로 기대.
   - 부수 발견: 같은 PDF 안에서도 정정 전/정정 후 사이에 주당 평가가액이 19,612원 → 19,538원으로 바뀌어 있음(문서 자체의 수치 변경, 추출 오류 아님).

2. **문서 선택 정정 - 같은 날 제출된 [기재정정]투자설명서에는 필요한 정보가 전부 있음**
   - 대상: `[쎄크][정정]투자설명서(2025.04.16).pdf` (전체 746,737자, 정정신고서보다 10배 이상 큼)
   - locateSections(windowChars 기본값 45,000, 조정 없이)로 자동 추출된 구간에 비교기업 6개사 명단과 개별 PER(티에스이 22.07배, 제이티 11.20배, 엔시스 10.58배, 자비스 23.75배, 기가비스 42.49배, 넥스틴 19.04배), 4단계 선정기준(업종→사업→재무→일반 유사성), 적용 PER 21.52배(6개사 산술평균과 정확히 일치)까지 모두 포함됨을 확인. 앵커/윈도우 로직 수정 불필요.
   - 투자설명서도 일부 구간(가. 평가결과 요약표)은 정정신고서와 마찬가지로 "정정 전/정정 후" diff 형식이지만, 바뀌지 않은 섹션(유사회사 선정 상세, PER 산정표)은 일반 본문으로 전체가 실려 있어 문제 없었음.

3. **환경 설정 오류 - OpenAI 프로젝트에 모델 접근 권한 없음 (코드 문제 아님)**
   - 증상: `node scripts/ipo-valuation.js <투자설명서.pdf>` 실행 시 `403 Project proj_3scYXhnv2qDtF0BAquuHAsoZ does not have access to model gpt-4.1`
   - 추가 테스트: gpt-4o, gpt-4o-mini, gpt-4.1-mini, gpt-5-mini 전부 동일한 403. `openai.models.list()`는 성공하지만 반환되는 모델이 0개.
   - 원인: OpenAI API 키 자체는 유효하지만, platform.openai.com의 해당 Project에 **허용 모델이 하나도 설정되어 있지 않음**(Project → Limits/Models 설정 문제로 추정). 우리 쪽 추출 코드나 스키마와는 무관.
   - 조치 필요: OpenAI 플랫폼에서 해당 프로젝트의 모델 접근 권한을 켜거나(Settings → Project → Models), 모델 접근이 켜져 있는 다른 프로젝트의 API 키로 교체해야 3단계(AI 구조화 추출)를 진행할 수 있음.
   - **해결(2026-11-23): OpenAI 대신 Claude API(claude-opus-5)로 교체.** OpenAI 프로젝트 권한 문제를 해결하는 대신, 추출 엔진 자체를 Anthropic Messages API의 구조화 출력(`output_config.format: json_schema`)으로 바꿈. 스키마(SCHEMA)는 그대로 재사용 가능했음 — Claude의 구조화 출력도 `additionalProperties:false` + `required` 필수인 동일한 JSON Schema 서브셋을 지원.

## 문서 선택 규칙

같은 회사·같은 공모에 대해 여러 DART 문서가 있을 때는 아래 우선순위로 고른다:
1. **투자설명서** (특히 [기재정정]투자설명서, 확정 조건 반영판) - 확정 수치와 비교기업 상세를 포함한 전체 문서
2. **최초 증권신고서(지분증권)** - 정정 전 원본, 전체 본문 포함
3. **정정 증권신고서(지분증권)** - "(주N) 정정 전/정정 후" diff 형식일 수 있어, 바뀌지 않은 섹션(예: 비교기업 선정 상세)이 빠져 있을 수 있음. 최후 수단으로만 사용.

## 지켜야 할 것
- 실제로 구현·테스트한 범위만 기록한다 (자기소개서에 그대로 쓰일 예정).
- DART API는 연동하지 않았다. PDF를 직접 받아 처리하는 방식이다. 새로 연동했다면 그 사실을 따로 기록한다.
- 마감: 신영증권 자소서 2026-11-16(월) 오전 10시. 11/13 밤까지 2~4단계가 안 끝나면 쎄크 수치는 손으로 추출하고 A로 넘어간다.

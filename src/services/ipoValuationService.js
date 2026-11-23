/**
 * 증권신고서(지분증권) 공모가 산정 근거 분석 서비스
 *
 * 파이프라인
 *  1) locateSections   : 규칙 기반으로 공모 개요 + 공모가격 결정방법(상대가치평가) 구간만 잘라낸다
 *  2) extractStructured: OpenAI에 JSON 스키마를 강제해 수치를 구조화한다 (수치별 원문 인용 포함)
 *  3) verify           : (a) 추출 수치가 원문에 실제로 있는지 대조 (b) 이익×멀티플÷주식수, 할인율→밴드 재계산
 *  4) toMarkdown       : 표와 검증 결과를 마크다운으로 만든다
 */
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// ---------- 1) 섹션 찾기 ----------
const ANCHORS = [
  /공모가격\s*결정\s*방법/,
  /공모가격\s*산정/,
  /상대가치\s*평가/,
  /비교\s*(대상\s*)?(기업|회사)\s*(의\s*)?선정/,
  /주당\s*평가\s*가액/,
  /할인율/,
  /적용\s*(PER|EV\/EBITDA|PSR|PBR)/i,
  /희망\s*공모\s*가(액)?\s*밴드/,
];
const OVERVIEW_ANCHORS = [/공모\s*희망\s*가/, /희망\s*공모\s*가/, /확정\s*공모\s*가/, /모집\s*\(?매출\)?\s*가액/];

function normalizeText(text) {
  return (text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
}

function findAll(text, re) {
  const out = [];
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = g.exec(text)) !== null) { out.push(m.index); if (out.length > 500) break; }
  return out;
}

/**
 * 앵커가 가장 촘촘하게 모여 있는 구간을 공모가 산정 섹션으로 본다.
 * 목차에도 같은 단어가 나오므로, 단어 '종류 수'가 아니라 구간 안의 '출현 횟수'로 점수를 매긴다.
 */
function locateSections(rawText, { windowChars = 45000, overviewChars = 12000 } = {}) {
  const text = normalizeText(rawText);
  const hits = [];
  ANCHORS.forEach((re, i) => findAll(text, re).forEach(pos => hits.push({ pos, i })));
  hits.sort((a, b) => a.pos - b.pos);

  let best = { score: 0, start: 0 };
  for (let a = 0; a < hits.length; a++) {
    const start = hits[a].pos;
    let count = 0; const kinds = new Set();
    for (let b = a; b < hits.length && hits[b].pos < start + windowChars; b++) { count++; kinds.add(hits[b].i); }
    const score = count + kinds.size * 3;
    if (score > best.score) best = { score, start };
  }
  const vStart = Math.max(0, best.start - 3000);
  const valuation = text.slice(vStart, vStart + windowChars);

  // 공모 개요(밴드, 확정 공모가)는 보통 문서 앞부분 요약에 있다
  let oStart = 0;
  for (const re of OVERVIEW_ANCHORS) { const p = text.search(re); if (p >= 0) { oStart = Math.max(0, p - 2000); break; } }
  const overview = text.slice(oStart, oStart + overviewChars);

  return {
    text,
    overview,
    valuation,
    stats: {
      totalChars: text.length,
      anchorHits: hits.length,
      valuationStart: vStart,
      valuationScore: best.score,
      sentChars: overview.length + valuation.length,
    },
  };
}

// ---------- 2) 구조화 추출 ----------
const num = { type: ['number', 'null'] };
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    company_name: { type: 'string' },
    lead_managers: { type: 'array', items: { type: 'string' } },
    valuation_method: { type: 'string', description: '예: PER 기준 상대가치평가' },
    multiple_type: { type: 'string', description: 'PER, EV/EBITDA, PSR 등' },
    peers: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: { name: { type: 'string' }, multiple: num, note: { type: 'string' } },
        required: ['name', 'multiple', 'note'],
      },
    },
    peer_selection_criteria: { type: 'array', items: { type: 'string' } },
    applied_multiple: num,
    earnings_basis: { type: 'string', description: '적용 이익의 기준. 예: 2025년 1분기 누적 연환산 당기순이익' },
    applied_earnings_krw: num,
    equity_value_krw: num,
    shares_for_valuation: num,
    value_per_share_krw: num,
    discount_rate_min_pct: num,
    discount_rate_max_pct: num,
    band_low_krw: num,
    band_high_krw: num,
    final_offer_price_krw: num,
    evidence: {
      type: 'array',
      description: '위 수치 필드마다 근거가 된 원문 문장을 그대로 옮긴다',
      items: {
        type: 'object', additionalProperties: false,
        properties: { field: { type: 'string' }, quote: { type: 'string' } },
        required: ['field', 'quote'],
      },
    },
  },
  required: ['company_name', 'lead_managers', 'valuation_method', 'multiple_type', 'peers', 'peer_selection_criteria',
    'applied_multiple', 'earnings_basis', 'applied_earnings_krw', 'equity_value_krw', 'shares_for_valuation',
    'value_per_share_krw', 'discount_rate_min_pct', 'discount_rate_max_pct', 'band_low_krw', 'band_high_krw',
    'final_offer_price_krw', 'evidence'],
};

const INSTRUCTIONS = `너는 IPO 증권신고서의 '공모가격 결정방법'을 읽는 애널리스트다.
규칙:
- 문서에 적힌 숫자만 쓴다. 계산하거나 추정하지 않는다. 문서에 없으면 null.
- 금액은 원 단위 숫자로 바꾼다 (예: 123억원 -> 12300000000, 1,234백만원 -> 1234000000).
- 할인율은 % 숫자로 쓴다 (예: 20.5% -> 20.5).
- peers에는 최종 선정된 비교기업과 각 기업의 멀티플을 넣는다. 제외된 기업은 넣지 않는다.
- evidence의 field에는 아래 필드 이름을 그대로 쓰고, quote에는 해당 숫자가 들어 있는 원문 문장을 한 글자도 바꾸지 말고 옮긴다: applied_multiple, applied_earnings_krw, equity_value_krw, shares_for_valuation, value_per_share_krw, discount_rate_min_pct, discount_rate_max_pct, band_low_krw, band_high_krw, final_offer_price_krw `;

async function extractStructured(sections, { model } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: model || process.env.ANTHROPIC_EXTRACT_MODEL || 'claude-opus-5',
    max_tokens: 8000,
    system: INSTRUCTIONS,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{
      role: 'user',
      content: `[공모 개요]\n${sections.overview}\n\n[공모가격 결정방법]\n${sections.valuation}`,
    }],
  });
  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error(`Claude 응답에 text 블록이 없습니다 (stop_reason: ${response.stop_reason}).`);
  return JSON.parse(textBlock.text);
}

// ---------- 3) 검증 ----------
function numberVariants(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return [];
  const out = new Set();
  const abs = Math.abs(v);
  const fixed = Number.isInteger(abs) ? String(abs) : String(+abs.toFixed(4));
  out.add(fixed);
  out.add(Number(fixed).toLocaleString('en-US', { maximumFractionDigits: 4 }));
  // 원 단위 금액은 백만원·억원 표기로도 찾는다
  if (Number.isInteger(abs) && abs >= 1e6 && abs % 1e6 === 0) out.add((abs / 1e6).toLocaleString('en-US'));
  if (Number.isInteger(abs) && abs >= 1e8 && abs % 1e8 === 0) out.add((abs / 1e8).toLocaleString('en-US'));
  if (Number.isInteger(abs) && abs >= 1e3 && abs % 1e3 === 0) out.add((abs / 1e3).toLocaleString('en-US'));
  return [...out];
}

function foundInSource(v, compactSource) {
  return numberVariants(v).some(s => compactSource.includes(s.replace(/\s/g, '')));
}

const close = (a, b, tol) => a !== null && b !== null && Math.abs(a - b) / Math.max(Math.abs(b), 1e-9) <= tol;

function verify(data, sourceText) {
  const compact = sourceText.replace(/\s/g, '');
  const quotes = {};
  (data.evidence || []).forEach(e => { (quotes[e.field] = quotes[e.field] || []).push(e.quote); });

  // 1·2자리 숫자(예: 20)는 문서 어디에나 있으므로, 원문에 실제로 있는 '인용 문장' 안에서 숫자를 확인해야 일치로 본다
  const judge = (field, v) => {
    if (v === null || v === undefined) return '문서에 없음';
    const qs = (quotes[field] || []).map(q => q.replace(/\s/g, '')).filter(q => q.length >= 6);
    const quoteOk = qs.some(q => compact.includes(q) && numberVariants(v).some(n => q.includes(n.replace(/\s/g, ''))));
    if (quoteOk) return '원문 일치 (인용 확인)';
    if (Math.abs(v) >= 1000 && foundInSource(v, compact)) return '원문에 수치 있음 (인용 없음)';
    return '확인 필요';
  };
  const fields = ['applied_multiple', 'applied_earnings_krw', 'equity_value_krw', 'shares_for_valuation', 'value_per_share_krw',
    'discount_rate_min_pct', 'discount_rate_max_pct', 'band_low_krw', 'band_high_krw', 'final_offer_price_krw'];
  const sourceCheck = fields.map(f => ({ field: f, value: data[f], status: judge(f, data[f]) }));
  (data.peers || []).forEach(p => sourceCheck.push({
    field: `비교기업 ${p.name}`, value: p.multiple,
    status: p.multiple === null ? '문서에 없음' : (foundInSource(p.multiple, compact) ? '원문에 수치 있음' : '확인 필요'),
  }));

  const calc = [];
  const peerVals = (data.peers || []).map(p => p.multiple).filter(v => typeof v === 'number');
  if (peerVals.length && data.applied_multiple !== null) {
    const avg = peerVals.reduce((a, b) => a + b, 0) / peerVals.length;
    calc.push({ check: '비교기업 멀티플 평균 = 적용 멀티플', expected: +avg.toFixed(2), reported: data.applied_multiple,
      ok: close(avg, data.applied_multiple, 0.01), note: '산술평균 기준. 가중평균이나 중앙값을 썼다면 불일치가 정상' });
  }
  if (data.applied_earnings_krw !== null && data.applied_multiple !== null && data.equity_value_krw !== null) {
    const ev = data.applied_earnings_krw * data.applied_multiple;
    calc.push({ check: '적용 이익 × 멀티플 = 평가 시가총액', expected: Math.round(ev), reported: data.equity_value_krw, ok: close(ev, data.equity_value_krw, 0.01) });
  }
  if (data.equity_value_krw !== null && data.shares_for_valuation) {
    const vps = data.equity_value_krw / data.shares_for_valuation;
    calc.push({ check: '평가 시가총액 ÷ 주식 수 = 주당 평가가액', expected: Math.round(vps), reported: data.value_per_share_krw, ok: close(vps, data.value_per_share_krw, 0.01) });
  }
  if (data.value_per_share_krw !== null && data.discount_rate_max_pct !== null && data.band_low_krw !== null) {
    const low = data.value_per_share_krw * (1 - data.discount_rate_max_pct / 100);
    calc.push({ check: '주당 평가가액 × (1 - 최대 할인율) ≈ 밴드 하단', expected: Math.round(low), reported: data.band_low_krw, ok: close(low, data.band_low_krw, 0.03), note: '호가 단위 절사로 ±3% 허용' });
  }
  if (data.value_per_share_krw !== null && data.discount_rate_min_pct !== null && data.band_high_krw !== null) {
    const high = data.value_per_share_krw * (1 - data.discount_rate_min_pct / 100);
    calc.push({ check: '주당 평가가액 × (1 - 최소 할인율) ≈ 밴드 상단', expected: Math.round(high), reported: data.band_high_krw, ok: close(high, data.band_high_krw, 0.03), note: '호가 단위 절사로 ±3% 허용' });
  }
  const implied = data.final_offer_price_krw !== null && data.value_per_share_krw
    ? +(100 * (1 - data.final_offer_price_krw / data.value_per_share_krw)).toFixed(1) : null;

  return { sourceCheck, calc, impliedFinalDiscountPct: implied };
}

// ---------- 4) 마크다운 ----------
const fmt = v => (v === null || v === undefined) ? '-' : (typeof v === 'number' ? v.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : String(v));

function toMarkdown(data, check, stats) {
  const L = [];
  L.push(`# ${data.company_name} 공모가 산정 근거 분석`);
  L.push('');
  L.push(`- 대표주관사: ${(data.lead_managers || []).join(', ') || '-'}`);
  L.push(`- 평가 방법: ${data.valuation_method} (${data.multiple_type})`);
  L.push(`- 적용 이익 기준: ${data.earnings_basis || '-'}`);
  L.push('');
  L.push('## 비교기업');
  L.push('| 기업 | 멀티플 | 비고 |'); L.push('|---|---|---|');
  (data.peers || []).forEach(p => L.push(`| ${p.name} | ${fmt(p.multiple)} | ${p.note || ''} |`));
  if ((data.peer_selection_criteria || []).length) { L.push(''); L.push('선정 기준: ' + data.peer_selection_criteria.join(' / ')); }
  L.push('');
  L.push('## 공모가 산정 흐름');
  L.push('| 항목 | 값 |'); L.push('|---|---|');
  [['적용 멀티플', data.applied_multiple], ['적용 이익(원)', data.applied_earnings_krw], ['평가 시가총액(원)', data.equity_value_krw],
   ['주식 수(주)', data.shares_for_valuation], ['주당 평가가액(원)', data.value_per_share_krw],
   ['할인율(%)', `${fmt(data.discount_rate_min_pct)} ~ ${fmt(data.discount_rate_max_pct)}`],
   ['희망 공모가 밴드(원)', `${fmt(data.band_low_krw)} ~ ${fmt(data.band_high_krw)}`],
   ['확정 공모가(원)', data.final_offer_price_krw],
   ['확정 공모가의 실질 할인율(%)', check.impliedFinalDiscountPct]].forEach(([k, v]) => L.push(`| ${k} | ${fmt(v)} |`));
  L.push('');
  L.push('## 검증 1. 원문 대조');
  L.push('| 항목 | 값 | 결과 |'); L.push('|---|---|---|');
  check.sourceCheck.forEach(c => L.push(`| ${c.field} | ${fmt(c.value)} | ${c.status} |`));
  L.push('');
  L.push('## 검증 2. 재계산');
  L.push('| 검증 | 재계산 | 문서 값 | 결과 |'); L.push('|---|---|---|---|');
  check.calc.forEach(c => L.push(`| ${c.check} | ${fmt(c.expected)} | ${fmt(c.reported)} | ${c.ok ? '일치' : '불일치'}${c.note ? ' (' + c.note + ')' : ''} |`));
  if (stats) { L.push(''); L.push(`> 전체 ${fmt(stats.totalChars)}자 중 ${fmt(stats.sentChars)}자만 AI에 전달했습니다.`); }
  return L.join('\n');
}

// ---------- 전체 실행 ----------
async function analyze(rawText, opts = {}) {
  const sections = locateSections(rawText);
  const data = opts.data || await extractStructured(sections, opts);
  const check = verify(data, sections.text);
  return { data, check, stats: sections.stats, markdown: toMarkdown(data, check, sections.stats) };
}

module.exports = { locateSections, extractStructured, verify, toMarkdown, analyze, SCHEMA };

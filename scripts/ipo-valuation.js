#!/usr/bin/env node
/**
 * 사용법
 *   node scripts/ipo-valuation.js <증권신고서.pdf>                    # 전체 실행 (OpenAI 호출)
 *   node scripts/ipo-valuation.js <증권신고서.pdf> --section-only     # 1단계만: 잘라낸 구간 확인
 *   node scripts/ipo-valuation.js <증권신고서.pdf> --data <추출.json>  # 2단계 생략: 손으로 만든 JSON으로 검증만
 * 결과는 PDF와 같은 폴더에 <파일명>.valuation.md / .json 으로 저장된다.
 */
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const svc = require('../src/services/ipoValuationService');

(async () => {
  const [file, ...rest] = process.argv.slice(2);
  if (!file) { console.error('PDF 경로를 넣어주세요.'); process.exit(1); }
  const { text } = await pdf(fs.readFileSync(file));
  const base = file.replace(/\.pdf$/i, '');

  if (rest.includes('--section-only')) {
    const s = svc.locateSections(text);
    fs.writeFileSync(`${base}.section.txt`, `[공모 개요]\n${s.overview}\n\n[공모가격 결정방법]\n${s.valuation}`);
    console.log(s.stats);
    console.log(`잘라낸 구간 저장: ${path.basename(base)}.section.txt`);
    return;
  }
  const di = rest.indexOf('--data');
  const opts = di >= 0 ? { data: JSON.parse(fs.readFileSync(rest[di + 1], 'utf8')) } : {};
  const result = await svc.analyze(text, opts);
  fs.writeFileSync(`${base}.valuation.md`, result.markdown);
  fs.writeFileSync(`${base}.valuation.json`, JSON.stringify({ data: result.data, check: result.check, stats: result.stats }, null, 2));
  console.log(result.markdown);
})().catch(e => { console.error('오류:', e.message); process.exit(1); });

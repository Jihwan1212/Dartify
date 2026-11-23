const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class ClaudeService {
  constructor() {
    this.initializeClient();
    this.model = 'claude-haiku-4-5-20251001';
    // claude-haiku-4.5 컨텍스트는 200K 토큰. system 프롬프트 + 응답(16,000)을 뺀
    // 본문 예산을 보수적으로 잡는다.
    this.maxTextTokens = 170000;
  }

  initializeClient() {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
      }

      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } catch (error) {
      console.error('Claude 클라이언트 초기화 오류:', error.message);
      this.client = null;
    }
  }

  // Claude 토큰 카운팅 API로 실제 토큰 수를 센다 (글자수 기반 추정은 한글·표 위주
  // 문서에서 실제 토큰 수를 2배 넘게 과소평가하는 경우가 있어 신뢰할 수 없음)
  async countTokens(text) {
    const resp = await this.client.messages.countTokens({
      model: this.model,
      messages: [{ role: 'user', content: text }],
    });
    return resp.input_tokens;
  }

  // 본문이 예산을 넘으면 실제 토큰 수 기준 비율로 잘라낸다
  async truncateText(text, maxTokens = this.maxTextTokens) {
    let tokenCount = await this.countTokens(text);
    if (tokenCount <= maxTokens) {
      return text;
    }

    console.log(`문서가 너무 길어서 일부만 분석합니다: ${tokenCount} → ${maxTokens} 토큰 목표`);

    let truncatedText = text;
    // 비율 계산 후 자르고, 그래도 넘치면 10%씩 더 줄여본다 (최대 5회)
    for (let attempt = 0; attempt < 5 && tokenCount > maxTokens; attempt++) {
      const ratio = (maxTokens / tokenCount) * 0.9;
      truncatedText = truncatedText.slice(0, Math.floor(truncatedText.length * ratio));
      tokenCount = await this.countTokens(truncatedText);
    }

    // 문장 단위로 자르기 (마지막 완전한 문장까지만)
    const lastSentenceIndex = truncatedText.lastIndexOf('.');
    if (lastSentenceIndex > truncatedText.length * 0.7) {
      truncatedText = truncatedText.substring(0, lastSentenceIndex + 1);
    }

    return truncatedText + '\n\n[문서가 너무 길어서 일부만 분석되었습니다. 더 정확한 분석을 위해 더 짧은 문서를 업로드해주세요.]';
  }

  // 공시 유형별로 정의된 프롬프트 조회
  getPromptForType(disclosureType, specificType) {
    const disclosureTypes = require('../models/disclosureTypes');

    if (disclosureTypes[disclosureType] &&
        disclosureTypes[disclosureType].types[specificType] &&
        disclosureTypes[disclosureType].types[specificType].prompt) {
      return disclosureTypes[disclosureType].types[specificType].prompt;
    }

    // 기본 프롬프트
    return `이 문서는 공시 자료입니다. 다음 항목을 중심으로 분석해주세요:

1. 문서의 주요 내용 요약
2. 재무적 영향 분석
3. 투자자 관점에서의 중요성
4. 향후 전망 및 리스크 요인

결과는 기업 분석 보고서 형식으로 제공해주세요.`;
  }

  async analyzeDocument(text, disclosureType, specificType) {
    try {
      if (!this.client) {
        this.initializeClient();
        if (!this.client) {
          throw new Error('Claude 서비스를 초기화할 수 없습니다. API 키를 확인해주세요.');
        }
      }

      const truncatedText = await this.truncateText(text);
      const systemPrompt = this.getPromptForType(disclosureType, specificType);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 16000,
        system: systemPrompt,
        messages: [{ role: 'user', content: truncatedText }],
      });

      const textBlock = response.content.find(block => block.type === 'text');
      if (!textBlock) {
        throw new Error(`응답에서 분석 결과를 찾을 수 없습니다 (stop_reason: ${response.stop_reason}).`);
      }

      return textBlock.text;
    } catch (error) {
      console.error('Claude 분석 중 오류:', error);

      if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message || '')) {
        throw new Error('Claude API 크레딧이 부족합니다. Anthropic 콘솔(Plans & Billing)에서 잔액을 확인해주세요.');
      }
      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error('Claude API 키가 만료되었거나 유효하지 않습니다. 관리자에게 문의해주세요.');
      }
      if (error instanceof Anthropic.PermissionDeniedError) {
        throw new Error('Claude API 키에 해당 모델 사용 권한이 없습니다. 관리자에게 문의해주세요.');
      }
      if (error instanceof Anthropic.NotFoundError) {
        throw new Error('설정된 모델을 찾을 수 없습니다. 관리자에게 문의해주세요.');
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      }
      if (error instanceof Anthropic.APIConnectionError) {
        throw new Error('네트워크 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      if (error instanceof Anthropic.APIError) {
        throw new Error('Claude API 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }

      throw new Error('문서 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }
}

module.exports = new ClaudeService();

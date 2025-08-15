const OpenAI = require('openai');
require('dotenv').config();

class OpenAIService {
  constructor() {
    this.initializeModel();
    // 환경 변수에서 프롬프트 ID를 읽어오거나 기본값 사용
    this.promptId = process.env.OPENAI_PROMPT_ID || "pmpt_689321d3b5e48196bb2cf970663b1bd208796189d84781fd";
    // 토큰 제한 설정 (더 보수적으로 설정)
    this.maxTokens = 200000; // 400,000 제한에서 안전한 마진 확보
  }

  initializeModel() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
      }
      
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      console.error('OpenAI 모델 초기화 오류:', error.message);
      this.openai = null;
    }
  }

  // 텍스트 길이 제한 및 요약 함수
  truncateText(text, maxTokens = this.maxTokens) {
    // 대략적인 토큰 계산 (영어 기준 1토큰 = 4글자, 한글 기준 1토큰 = 2글자)
    const estimatedTokens = this.estimateTokenCount(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    // 토큰 제한에 맞게 텍스트 자르기 (더 보수적으로)
    const maxChars = Math.floor(maxTokens * 2); // 더 보수적인 마진
    let truncatedText = text.substring(0, maxChars);
    
    // 문장 단위로 자르기 (마지막 완전한 문장까지만)
    const lastSentenceIndex = truncatedText.lastIndexOf('.');
    if (lastSentenceIndex > maxChars * 0.7) {
      truncatedText = truncatedText.substring(0, lastSentenceIndex + 1);
    }
    
    console.log(`텍스트 길이 제한: ${estimatedTokens} → ${this.estimateTokenCount(truncatedText)} 토큰`);
    
    return truncatedText + '\n\n[문서가 너무 길어서 일부만 분석되었습니다. 더 정확한 분석을 위해 더 짧은 문서를 업로드해주세요.]';
  }



  // 토큰 수 추정 함수
  estimateTokenCount(text) {
    // 영어와 한글을 구분하여 토큰 수 추정
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const otherChars = text.length - englishChars - koreanChars;
    
    // 영어: 1토큰 = 4글자, 한글: 1토큰 = 2글자, 기타: 1토큰 = 3글자
    return Math.ceil(englishChars / 4 + koreanChars / 2 + otherChars / 3);
  }

  async analyzeDocument(text, disclosureType, specificType) {
    try {
      // 모델이 초기화되지 않은 경우 재시도
      if (!this.openai) {
        this.initializeModel();
        if (!this.openai) {
          throw new Error('OpenAI 서비스를 초기화할 수 없습니다. API 키를 확인해주세요.');
        }
      }

      // 텍스트 길이 확인
      const estimatedTokens = this.estimateTokenCount(text);
      console.log(`예상 토큰 수: ${estimatedTokens}`);

      // 긴 문서인 경우 단순히 잘라서 처리
      if (estimatedTokens > this.maxTokens) {
        console.log('문서가 너무 길어서 일부만 분석합니다.');
      }

      // 텍스트 길이 제한 적용
      const truncatedText = this.truncateText(text);
      
      // 새로운 Prompt API 사용 - 올바른 파라미터 구조
      const response = await this.openai.responses.create({
        prompt: {
          "id": this.promptId,
          "version": "1"
        },
        // input을 문자열로 전달
        input: `문서 내용: ${truncatedText}\n공시 유형: ${disclosureType}\n세부 유형: ${specificType}`
      });

      // 응답 구조에 따라 결과 추출
      if (response.output_text) {
        return response.output_text;
      } else if (response.output && response.output[0] && response.output[0].content) {
        return response.output[0].content[0].text;
      } else {
        throw new Error('응답에서 분석 결과를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('OpenAI 분석 중 오류:', error);
      
      // 토큰 제한 오류 처리
      if (error.code === 'rate_limit_exceeded' || error.message.includes('too large')) {
        throw new Error('문서가 너무 길어서 분석할 수 없습니다. 더 짧은 문서를 업로드해주세요.');
      }
      
      // API 키 관련 오류 처리
      if (error.message && (error.message.includes('API key') || error.message.includes('authentication'))) {
        throw new Error('OpenAI API 키가 만료되었거나 유효하지 않습니다. 관리자에게 문의해주세요.');
      }
      
      // 프롬프트 ID 관련 오류 처리
      if (error.message && error.message.includes('prompt')) {
        throw new Error('설정된 프롬프트를 찾을 수 없습니다. 프롬프트 ID를 확인해주세요.');
      }

      // 파라미터 관련 오류 처리
      if (error.message && error.message.includes('Unknown parameter')) {
        console.error('API 파라미터 오류:', error.message);
        throw new Error('OpenAI API 파라미터 설정에 문제가 있습니다. 관리자에게 문의해주세요.');
      }
      
      // 네트워크 오류 처리
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        throw new Error('네트워크 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      
      throw new Error('문서 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }



  // 프롬프트 ID 설정 메서드 (필요시 다른 프롬프트로 변경 가능)
  setPromptId(promptId) {
    this.promptId = promptId;
  }

  // 현재 프롬프트 ID 조회
  getPromptId() {
    return this.promptId;
  }

  // 토큰 제한 설정
  setMaxTokens(maxTokens) {
    this.maxTokens = maxTokens;
  }

  // 기존 메서드는 호환성을 위해 유지
  getPromptForType(disclosureType, specificType) {
    const disclosureTypes = require('../models/disclosureTypes');
    
    if (disclosureTypes[disclosureType] && 
        disclosureTypes[disclosureType].types[specificType]) {
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
}

module.exports = new OpenAIService(); 
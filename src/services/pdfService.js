const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

class SimplePDFService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.tempDir = path.join(__dirname, '../../temp');
    this.maxTextLength = 5000; // 최대 텍스트 길이 제한
    this.ocrEnabled = false; // OCR 비활성화
    
    // 임시 디렉토리 생성
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async parsePDF(filePath) {
    try {
      // 파일 존재 확인
      if (!fs.existsSync(filePath)) {
        throw new Error('PDF 파일을 찾을 수 없습니다.');
      }

      // 기본 텍스트 추출만 사용 (OCR 비활성화)
      let extractedText = await this.extractBasicText(filePath);
      
      // 텍스트가 부족한 경우에만 OCR 시도 (설정에 따라)
      if ((!extractedText || extractedText.trim().length < 100) && this.ocrEnabled) {
        console.log('기본 텍스트 추출 실패, OCR 시도 중...');
        extractedText = await this.extractTextWithOCR(filePath);
      }

      // 텍스트 길이 제한 적용
      if (extractedText && extractedText.length > this.maxTextLength) {
        extractedText = this.truncateText(extractedText);
      }

      // 메타데이터 추출 (최소화)
      const metadata = await this.extractBasicMetadata(filePath);

      // 최종 검증
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('PDF에서 충분한 텍스트를 추출할 수 없습니다. 텍스트가 포함된 PDF를 업로드해주세요.');
      }

      return {
        text: this.cleanText(extractedText),
        pages: metadata.pages || 1,
        info: metadata,
        hasOCR: false // OCR 사용 안함
      };

    } catch (error) {
      console.error('PDF 파싱 중 오류:', error);
      throw this.handleError(error);
    }
  }

  async extractBasicText(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        return null;
      }
      
      return data.text;
    } catch (error) {
      console.log('기본 텍스트 추출 실패:', error.message);
      return null;
    }
  }

  // OCR 기능은 유지하되 기본적으로 비활성화
  async extractTextWithOCR(filePath) {
    if (!this.ocrEnabled) {
      return null;
    }
    
    try {
      console.log('OCR 처리 시작...');
      // OCR 관련 코드는 유지하되 사용하지 않음
      return null;
    } catch (error) {
      console.error('OCR 처리 실패:', error);
      return null;
    }
  }

  async extractBasicMetadata(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      return {
        pages: data.numpages,
        info: {
          Title: data.info?.Title || '',
          Author: data.info?.Author || '',
          Subject: data.info?.Subject || ''
        }
      };
    } catch (error) {
      console.log('메타데이터 추출 실패:', error.message);
      return { pages: 1, info: {} };
    }
  }

  // 텍스트 길이 제한 함수
  truncateText(text) {
    if (!text || text.length <= this.maxTextLength) {
      return text;
    }
    
    // 문장 단위로 자르기
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let truncatedText = '';
    
    for (const sentence of sentences) {
      if ((truncatedText + sentence).length > this.maxTextLength) {
        break;
      }
      truncatedText += sentence + '. ';
    }
    
    return truncatedText.trim() || text.substring(0, this.maxTextLength);
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .replace(/\n\s*\n/g, '\n') // 빈 줄 정리
      .replace(/[^\w\s가-힣.,!?;:()\[\]{}"'\-]/g, '') // 특수문자 정리 (한글 보존)
      .replace(/(\w)\1{3,}/g, '$1$1$1') // 연속된 같은 문자 제한
      .replace(/\s{2,}/g, ' ') // 연속된 공백 제거
      .trim();
  }

  async validatePDF(file) {
    try {
      // 파일 크기 검증
      if (file.size > this.maxFileSize) {
        throw new Error('파일 크기가 10MB를 초과합니다.');
      }

      // 파일 타입 검증
      if (!file.mimetype.includes('pdf')) {
        throw new Error('PDF 파일만 업로드 가능합니다.');
      }

      // 파일명 검증
      if (!file.originalname || !file.originalname.toLowerCase().endsWith('.pdf')) {
        throw new Error('PDF 파일만 업로드 가능합니다.');
      }

      return true;
    } catch (error) {
      console.error('PDF 검증 중 오류:', error);
      throw error;
    }
  }

  // OCR 설정 메서드
  setOCREnabled(enabled) {
    this.ocrEnabled = enabled;
  }

  // 텍스트 길이 제한 설정 메서드
  setMaxTextLength(length) {
    this.maxTextLength = length;
  }

  handleError(error) {
    // 구체적인 에러 메시지 제공
    if (error.message.includes('텍스트를 추출할 수 없')) {
      return new Error('PDF에서 텍스트를 추출할 수 없습니다. 스캔된 이미지가 아닌 텍스트가 포함된 PDF를 업로드해주세요.');
    }
    
    if (error.message.includes('텍스트가 너무 적')) {
      return new Error('PDF에서 추출된 텍스트가 너무 적습니다. 텍스트가 포함된 PDF를 업로드해주세요.');
    }
    
    if (error.message.includes('파일을 찾을 수 없')) {
      return new Error('업로드된 파일을 찾을 수 없습니다. 다시 시도해주세요.');
    }
    
    return new Error('PDF 파일을 읽을 수 없습니다. 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.');
  }

  // 임시 파일 정리
  cleanupTempFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      console.error('임시 파일 정리 실패:', error);
    }
  }
}

module.exports = new SimplePDFService(); 
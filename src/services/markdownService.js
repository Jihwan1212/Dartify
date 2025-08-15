const { marked } = require('marked');

class MarkdownService {
  constructor() {
    this.initializeMarked();
  }

  initializeMarked() {
    // marked 설정
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
      mangle: false
    });

    // 커스텀 렌더러 설정
    const renderer = new marked.Renderer();
    
    // 제목 렌더링 커스터마이징
    renderer.heading = (text, level) => {
      const sectionClass = this.getSectionClass(text, level);
      return `<div class="analysis-section ${sectionClass}">
        <div class="section-title">${text}</div>
        <div class="section-content">`;
    };

    // 단락 렌더링 커스터마이징
    renderer.paragraph = (text) => {
      return `<div class="subsection-card">
        <div class="analysis-paragraph">${text}</div>
      </div>`;
    };

    // 리스트 렌더링 커스터마이징
    renderer.list = (body, ordered) => {
      const listClass = ordered ? 'numbered-list' : 'bullet-list';
      return `<div class="subsection-card">
        <ul class="trendy-list ${listClass}">${body}</ul>
      </div>`;
    };

    // 리스트 아이템 렌더링 커스터마이징
    renderer.listitem = (text, task, checked) => {
      if (task) {
        const checkbox = checked ? 'checked' : '';
        return `<li class="task-item" data-checked="${checked}">
          <input type="checkbox" ${checkbox} disabled>
          <span>${text}</span>
        </li>`;
      }
      
      // 번호가 있는 리스트인지 확인
      const isNumbered = /^\d+\./.test(text);
      if (isNumbered) {
        const number = text.match(/^(\d+)\./)[1];
        return `<li class="numbered-item" data-number="${number}">${text.replace(/^\d+\.\s*/, '')}</li>`;
      } else {
        return `<li class="bullet-item">${text}</li>`;
      }
    };

    // 강조 텍스트 렌더링 커스터마이징
    renderer.strong = (text) => {
      return `<strong class="highlight">${text}</strong>`;
    };

    renderer.em = (text) => {
      return `<em class="emphasis">${text}</em>`;
    };

    // 링크 렌더링 커스터마이징
    renderer.link = (href, title, text) => {
      return `<a href="${href}" class="trendy-link" target="_blank" rel="noopener" title="${title || ''}">${text}</a>`;
    };

    // 코드 블록 렌더링 커스터마이징
    renderer.code = (code, language) => {
      return `<div class="code-block">${code}</div>`;
    };

    renderer.codespan = (code) => {
      return `<code class="inline-code">${code}</code>`;
    };

    // 구분선 렌더링 커스터마이징
    renderer.hr = () => {
      return '<hr class="trendy-divider">';
    };

    // 인용구 렌더링 커스터마이징
    renderer.blockquote = (quote) => {
      return `<div class="subsection-card">
        <blockquote class="trendy-quote">${quote}</blockquote>
      </div>`;
    };

    // 테이블 렌더링 커스터마이징
    renderer.table = (header, body) => {
      return `<div class="subsection-card">
        <div class="trendy-table-container">
          <table class="trendy-table">
            <thead>${header}</thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>`;
    };

    marked.use({ renderer });
  }

  // 제목에 따라 섹션 클래스 결정
  getSectionClass(title, level) {
    // 마크다운 헤딩 레벨을 기준으로 섹션 구분
    switch (level) {
      case 1:
        return 'main-section'; // # 제목
      case 2:
        return 'sub-section';  // ## 제목
      case 3:
      case 4:
      case 5:
      case 6:
        return 'detail-section'; // ###, ####, #####, ###### 제목
      default:
        return 'detail-section'; // 기본값
    }
  }

  // 마크다운을 트렌디한 HTML로 변환
  convertToTrendyHTML(markdown) {
    try {
      // 마크다운을 HTML로 변환
      let html = marked(markdown);
      
      // 섹션 구조 정리
      html = this.fixSectionStructure(html);
      
      // 전체를 컨테이너로 감싸기
      html = `<div class="trendy-result-container">${html}</div>`;
      
      return html;
    } catch (error) {
      console.error('마크다운 변환 오류:', error);
      // 오류 발생 시 기본 텍스트로 표시
      return `<div class="trendy-result-container">
        <div class="analysis-section">
          <div class="section-content">
            <div class="subsection-card">
              <div class="analysis-paragraph">${markdown}</div>
            </div>
          </div>
        </div>
      </div>`;
    }
  }

  // 섹션 구조 수정
  fixSectionStructure(html) {
    // 섹션 닫기 태그 추가
    html = html.replace(/<div class="analysis-section[^>]*>/g, (match) => {
      return match + '<div class="section-content">';
    });

    // 마지막 섹션 닫기
    html = html.replace(/<\/div>\s*<\/div>\s*<\/div>\s*$/g, '</div></div></div>');
    
    // 빈 섹션 제거
    html = html.replace(/<div class="analysis-section[^>]*>\s*<div class="section-title">[^<]*<\/div>\s*<div class="section-content">\s*<\/div>\s*<\/div>\s*<\/div>/g, '');
    
    return html;
  }

  // 마크다운 유효성 검사
  validateMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return { valid: false, error: '마크다운 텍스트가 유효하지 않습니다.' };
    }

    if (markdown.trim().length === 0) {
      return { valid: false, error: '마크다운 텍스트가 비어있습니다.' };
    }

    return { valid: true };
  }

  // 마크다운에서 텍스트만 추출 (복사용)
  extractTextFromMarkdown(markdown) {
    try {
      // 마크다운 태그 제거
      let text = markdown
        .replace(/^#{1,6}\s+/gm, '') // 제목 제거
        .replace(/\*\*(.*?)\*\*/g, '$1') // 볼드 제거
        .replace(/\*(.*?)\*/g, '$1') // 이탤릭 제거
        .replace(/`(.*?)`/g, '$1') // 인라인 코드 제거
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 제거
        .replace(/^[-*+]\s+/gm, '') // 불릿 포인트 제거
        .replace(/^\d+\.\s+/gm, '') // 번호 매기기 제거
        .replace(/^>\s+/gm, '') // 인용구 제거
        .replace(/^--+$/gm, '') // 구분선 제거
        .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
        .replace(/\n\s*\n/g, '\n\n') // 빈 줄 정리
        .trim();

      return text;
    } catch (error) {
      console.error('텍스트 추출 오류:', error);
      return markdown;
    }
  }
}

module.exports = new MarkdownService(); 
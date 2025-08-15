-- Dartify 분석 결과 테이블
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    disclosure_type VARCHAR(100) NOT NULL,
    specific_type VARCHAR(100) NOT NULL,
    analysis_result TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    pages INTEGER DEFAULT 1,
    user_id VARCHAR(255), -- Clerk 사용자 ID
    user_email VARCHAR(255), -- 사용자 이메일
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_disclosure_type ON analysis_results(disclosure_type);
CREATE INDEX IF NOT EXISTS idx_analysis_results_filename ON analysis_results(filename);

-- RLS (Row Level Security) 정책
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 분석 결과만 볼 수 있도록 정책 설정
CREATE POLICY "Users can view their own analysis results" ON analysis_results
    FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

-- 인증된 사용자만 자신의 분석 결과를 삽입할 수 있도록 정책 설정
CREATE POLICY "Users can insert their own analysis results" ON analysis_results
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 사용자는 자신의 분석 결과만 업데이트할 수 있도록 정책 설정
CREATE POLICY "Users can update their own analysis results" ON analysis_results
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 사용자는 자신의 분석 결과만 삭제할 수 있도록 정책 설정
CREATE POLICY "Users can delete their own analysis results" ON analysis_results
    FOR DELETE USING (auth.uid()::text = user_id);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_analysis_results_updated_at 
    BEFORE UPDATE ON analysis_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- PDF 처리 통계 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS pdf_processing_stats (
    id SERIAL PRIMARY KEY,
    total_files_processed INTEGER DEFAULT 0,
    ocr_used_count INTEGER DEFAULT 0,
    table_extracted_count INTEGER DEFAULT 0,
    avg_processing_time_ms INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 통계 레코드 삽입
INSERT INTO pdf_processing_stats (total_files_processed, ocr_used_count, table_extracted_count, avg_processing_time_ms)
VALUES (0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- 기존 테이블에 새 필드 추가 (이미 존재하는 테이블 업데이트용)
-- 이 부분은 기존 테이블이 있을 때 실행
DO $$
BEGIN
    -- has_ocr 컬럼이 있으면 제거 (최소화된 PDF 처리로 인해 불필요)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'analysis_results' AND column_name = 'has_ocr') THEN
        ALTER TABLE analysis_results DROP COLUMN has_ocr;
    END IF;
    
    -- table_count 컬럼이 있으면 제거 (최소화된 PDF 처리로 인해 불필요)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'analysis_results' AND column_name = 'table_count') THEN
        ALTER TABLE analysis_results DROP COLUMN table_count;
    END IF;
END $$; 
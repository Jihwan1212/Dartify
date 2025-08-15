const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const analysisRoutes = require('./routes/analysisRoutes');
const configRoutes = require('./routes/configRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 환경변수 확인 및 기본값 설정
const corsOrigin = process.env.CORS_ORIGIN || '*';
console.log('🚀 서버 시작 중...');
console.log(`📊 포트: ${PORT}`);
console.log(`🌐 CORS Origin: ${corsOrigin}`);

// uploads 디렉토리 생성
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ uploads 디렉토리가 생성되었습니다.');
}

// 미들웨어 설정
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '../public')));

// API 라우트
app.use('/api/analysis', analysisRoutes);
app.use('/api/config', configRoutes);

// Healthcheck 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Dartify 서버가 정상적으로 실행 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 10MB를 초과합니다.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: '예상치 못한 파일이 업로드되었습니다.' });
    }
    return res.status(400).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
  }
  
  // 타임아웃 오류 처리
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return res.status(408).json({ error: '요청 시간이 초과되었습니다. 다시 시도해주세요.' });
  }
  
  res.status(500).json({
    error: error.message || '서버 내부 오류가 발생했습니다.'
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Dartify 서버가 포트 ${PORT}에서 실행 중입니다!`);
  console.log(`📊 공시 분석 플랫폼 준비 완료`);
  console.log(`🌐 http://localhost:${PORT}`);
});

module.exports = app; 
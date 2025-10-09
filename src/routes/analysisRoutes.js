const express = require('express');
const multer = require('multer');
const path = require('path');
const { analyzeDocument, getDisclosureTypes, getAnalysisHistory, getAnalysisResult, deleteAnalysisResult, deleteAllAnalysisResults } = require('../controllers/analysisController');

const router = express.Router();

// Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 운영체제에 상관없이 올바른 경로 사용
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // 파일 확장자를 안전하게 추출
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 분석 관련 라우트
router.post('/analyze', upload.single('document'), analyzeDocument);
router.get('/disclosure-types', getDisclosureTypes);
router.get('/history', getAnalysisHistory);
router.get('/result/:id', getAnalysisResult);
router.delete('/result/:id', deleteAnalysisResult);
router.delete('/history', deleteAllAnalysisResults);

module.exports = router; 
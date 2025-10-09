const { OpenAI } = require('openai');
const pdf = require('pdf-parse');
const fs = require('fs');
const { supabase, getUserSpecificSupabase, validateUserAccess } = require('../config/supabase');
const markdownService = require('../services/markdownService');
const openaiService = require('../services/openaiService');
const path = require('path');

// OpenAI 클라이언트 초기화 (백업용)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 문서 분석
const analyzeDocument = async (req, res) => {
    let tempFilePath = null;
    
    try {
        const { disclosureType, specificType } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
        }

        if (!disclosureType || !specificType) {
            return res.status(400).json({ error: '공시 유형을 선택해주세요.' });
        }

        // 운영체제에 상관없이 올바른 경로 처리
        tempFilePath = path.normalize(file.path);

        // PDF 파일 읽기
        const dataBuffer = fs.readFileSync(tempFilePath);
        const pdfData = await pdf(dataBuffer);

        // 텍스트 길이 검증
        if (!pdfData.text || pdfData.text.trim().length < 100) {
            throw new Error('PDF에서 텍스트를 추출할 수 없거나 내용이 너무 적습니다.');
        }

        // 파일명 인코딩 문제 해결
        let safeFilename = file.originalname;
        
        // UTF-8 인코딩 문제 해결
        try {
            // Buffer를 사용하여 UTF-8로 변환
            const buffer = Buffer.from(file.originalname, 'latin1');
            safeFilename = buffer.toString('utf8');
        } catch (e) {
            console.log('UTF-8 변환 실패, 원본 사용:', e);
            safeFilename = file.originalname;
        }
        
        try {
            // URL 디코딩 시도
            safeFilename = decodeURIComponent(safeFilename);
        } catch (e) {
            // 디코딩 실패 시 원본 사용
            safeFilename = safeFilename;
        }
        
        // 파일명이 비어있거나 너무 짧으면 기본값 사용
        if (!safeFilename || safeFilename.length < 3) {
            safeFilename = `분석문서_${new Date().toISOString().slice(0, 10)}.pdf`;
        }
        
        console.log('원본 파일명:', file.originalname);
        console.log('처리된 파일명:', safeFilename);

        // openaiService를 사용하여 분석
        const analysisResult = await openaiService.analyzeDocument(
            pdfData.text, 
            disclosureType, 
            specificType
        );

        // Supabase에 저장
        if (supabase) {
            try {
                const clerkUser = req.headers['x-clerk-user'] ? JSON.parse(req.headers['x-clerk-user']) : null;
                
                console.log('🔍 분석 저장 - Clerk 사용자 정보:', {
                    hasUser: !!clerkUser,
                    userId: clerkUser?.id,
                    userEmail: clerkUser?.emailAddresses?.[0]?.emailAddress
                });
                
                const { data, error } = await supabase
                    .from('analysis_results')
                    .insert({
                        filename: safeFilename, // 안전한 파일명 사용
                        disclosure_type: disclosureType,
                        specific_type: specificType,
                        analysis_result: analysisResult,
                        file_size: file.size,
                        pages: pdfData.numpages || 1,
                        user_id: clerkUser?.id || null
                    });

                if (error) {
                    console.error('❌ Supabase 저장 오류:', error);
                } else {
                    console.log('✅ 분석 결과가 Supabase에 저장되었습니다. ID:', data?.[0]?.id);
                }
            } catch (dbError) {
                console.error('❌ Supabase 저장 중 오류:', dbError);
            }
        }

        res.json({
            success: true,
            result: analysisResult
        });

    } catch (error) {
        console.error('분석 중 오류:', error);
        res.status(500).json({
            error: error.message || '문서 분석 중 오류가 발생했습니다.'
        });
    } finally {
        // 임시 파일 정리 (운영체제별 안전한 처리)
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                // Windows에서는 파일이 잠겨있을 수 있으므로 약간의 지연 후 삭제 시도
                setTimeout(() => {
                    try {
                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                            console.log('✅ 임시 파일 삭제 완료:', tempFilePath);
                        }
                    } catch (delayedError) {
                        console.error('⚠️ 임시 파일 지연 삭제 실패:', delayedError.message);
                    }
                }, 100);
            } catch (cleanupError) {
                console.error('⚠️ 임시 파일 삭제 중 오류:', cleanupError.message);
            }
        }
    }
};

// 공시 유형 가져오기
const getDisclosureTypes = async (req, res) => {
    try {
        const disclosureTypes = require('../models/disclosureTypes');
        res.json({
            success: true,
            types: disclosureTypes
        });
    } catch (error) {
        console.error('공시 유형 조회 오류:', error);
        res.status(500).json({
            error: '공시 유형을 불러올 수 없습니다.'
        });
    }
};

// 분석 기록 가져오기
const getAnalysisHistory = async (req, res) => {
    try {
        console.log('🔍 getAnalysisHistory 호출됨');
        console.log('📋 요청 헤더:', req.headers);
        
        if (!supabase) {
            console.error('❌ Supabase가 설정되지 않음');
            return res.status(500).json({
                success: false,
                message: 'Supabase가 설정되지 않아 분석 기록을 불러올 수 없습니다.'
            });
        }

        console.log('✅ Supabase 연결 확인됨');
        
        const clerkUser = req.headers['x-clerk-user'] ? JSON.parse(req.headers['x-clerk-user']) : null;
        console.log('👤 Clerk 사용자 정보:', clerkUser ? '존재함' : '없음');
        
        // 보안 검증
        try {
            validateUserAccess(clerkUser);
        } catch (authError) {
            console.error('❌ 인증 실패:', authError.message);
            return res.status(401).json({
                success: false,
                message: authError.message
            });
        }

        console.log('🔍 Supabase 쿼리 시작 - 사용자 ID:', clerkUser.id);
        
        // 개선된 사용자별 데이터 접근 사용
        const userSupabase = getUserSpecificSupabase(clerkUser);
        if (!userSupabase) {
            return res.status(500).json({
                success: false,
                message: '사용자 컨텍스트 설정에 실패했습니다.'
            });
        }

        try {
            // 사용자별 분석 기록 조회
            const userData = await userSupabase.getUserData('analysis_results', {});
            
            console.log('✅ 분석 기록 조회 성공 - 개수:', userData ? userData.length : 0);
            
            res.json({
                success: true,
                history: userData || []
            });
        } catch (queryError) {
            console.error('❌ 사용자 데이터 조회 실패:', queryError);
            return res.status(500).json({
                success: false,
                message: '분석 기록을 불러올 수 없습니다.',
                error: queryError.message
            });
        }
    } catch (error) {
        console.error('❌ getAnalysisHistory 전체 오류:', error);
        console.error('❌ 오류 스택:', error.stack);
        res.status(500).json({
            success: false,
            message: '분석 기록을 불러올 수 없습니다.',
            error: error.message
        });
    }
};

// 특정 분석 결과 가져오기
const getAnalysisResult = async (req, res) => {
    try {
        console.log('🔍 getAnalysisResult 호출됨');
        console.log('📋 요청 파라미터:', req.params);
        console.log('📋 요청 헤더:', req.headers);
        
        if (!supabase) {
            console.error('❌ Supabase가 설정되지 않음');
            return res.status(500).json({
                success: false,
                message: 'Supabase가 설정되지 않아 분석 결과를 불러올 수 없습니다.'
            });
        }

        const { id } = req.params;
        console.log('🔍 요청된 분석 ID:', id);
        
        const clerkUser = req.headers['x-clerk-user'] ? JSON.parse(req.headers['x-clerk-user']) : null;
        console.log('👤 Clerk 사용자 정보:', clerkUser ? '존재함' : '없음');
        console.log('👤 Clerk 사용자 ID:', clerkUser?.id);
        
        // 보안 검증
        try {
            validateUserAccess(clerkUser);
        } catch (authError) {
            console.error('❌ 인증 실패:', authError.message);
            return res.status(401).json({
                success: false,
                message: authError.message
            });
        }

        console.log('🔍 Supabase 쿼리 시작 - ID:', id, '사용자 ID:', clerkUser.id);
        
        // 사용자별 데이터 접근 사용
        const userSupabase = getUserSpecificSupabase(clerkUser);
        if (!userSupabase) {
            return res.status(500).json({
                success: false,
                message: '사용자 컨텍스트 설정에 실패했습니다.'
            });
        }

        try {
            // 사용자별로 해당 ID의 분석 결과 조회
            const { data, error } = await userSupabase.supabase
                .from('analysis_results')
                .select('*')
                .eq('id', id)
                .eq('user_id', clerkUser.id)
                .single();

            if (error) {
                console.error('❌ 분석 결과 조회 실패:', error);
                return res.status(404).json({
                    success: false,
                    message: '해당 ID의 분석 결과를 찾을 수 없습니다.',
                    requestedId: id
                });
            }

            if (!data) {
                console.error('❌ 해당 ID의 분석 결과가 존재하지 않음:', id);
                return res.status(404).json({
                    success: false,
                    message: '해당 ID의 분석 결과를 찾을 수 없습니다.',
                    requestedId: id
                });
            }

            console.log('✅ 분석 결과 조회 성공');
            
            res.json({
                success: true,
                result: data
            });
        } catch (queryError) {
            console.error('❌ 분석 결과 조회 실패:', queryError);
            return res.status(500).json({
                success: false,
                message: '분석 결과를 불러올 수 없습니다.',
                error: queryError.message
            });
        }
    } catch (error) {
        console.error('❌ getAnalysisResult 전체 오류:', error);
        console.error('❌ 오류 스택:', error.stack);
        res.status(500).json({
            success: false,
            message: '분석 결과를 불러올 수 없습니다.',
            error: error.message
        });
    }
};

// 분석 기록 삭제
const deleteAnalysisResult = async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({
                success: false,
                message: 'Supabase가 설정되지 않아 분석 기록을 삭제할 수 없습니다.'
            });
        }

        const { id } = req.params;
        const clerkUser = req.headers['x-clerk-user'] ? JSON.parse(req.headers['x-clerk-user']) : null;
        
        // 보안 검증
        try {
            validateUserAccess(clerkUser);
        } catch (authError) {
            console.error('❌ 인증 실패:', authError.message);
            return res.status(401).json({
                success: false,
                message: authError.message
            });
        }

        if (!clerkUser || !clerkUser.id) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }
        
        // 사용자별로 분석 결과가 존재하는지 먼저 확인
        const { data: existingData, error: checkError } = await supabase
            .from('analysis_results')
            .select('id')
            .eq('id', id)
            .eq('user_id', clerkUser.id)
            .single();

        if (checkError || !existingData) {
            return res.status(404).json({
                success: false,
                message: '삭제할 분석 기록을 찾을 수 없습니다.'
            });
        }

        // 분석 결과 삭제
        const { error: deleteError } = await supabase
            .from('analysis_results')
            .delete()
            .eq('id', id)
            .eq('user_id', clerkUser.id);

        if (deleteError) {
            console.error('분석 기록 삭제 오류:', deleteError);
            return res.status(500).json({
                success: false,
                message: '분석 기록 삭제 중 오류가 발생했습니다.'
            });
        }

        res.json({
            success: true,
            message: '분석 기록이 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        console.error('분석 기록 삭제 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '분석 기록 삭제 중 오류가 발생했습니다.'
        });
    }
};

// 모든 분석 기록 삭제
const deleteAllAnalysisResults = async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({
                success: false,
                message: 'Supabase가 설정되지 않아 분석 기록을 삭제할 수 없습니다.'
            });
        }

        const clerkUser = req.headers['x-clerk-user'] ? JSON.parse(req.headers['x-clerk-user']) : null;
        
        // 보안 검증
        try {
            validateUserAccess(clerkUser);
        } catch (authError) {
            console.error('❌ 인증 실패:', authError.message);
            return res.status(401).json({
                success: false,
                message: authError.message
            });
        }

        if (!clerkUser || !clerkUser.id) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        // 먼저 해당 사용자의 모든 분석 결과를 조회
        const { data: existingData, error: checkError } = await supabase
            .from('analysis_results')
            .select('id')
            .eq('user_id', clerkUser.id);

        if (checkError) {
            console.error('분석 기록 조회 오류:', checkError);
            return res.status(500).json({
                success: false,
                message: '분석 기록을 조회할 수 없습니다.'
            });
        }

        // 삭제할 기록이 없는 경우
        if (!existingData || existingData.length === 0) {
            return res.status(404).json({
                success: false,
                message: '삭제할 분석 기록이 없습니다.'
            });
        }

        // 해당 사용자의 모든 분석 결과 삭제
        const { error: deleteError } = await supabase
            .from('analysis_results')
            .delete()
            .eq('user_id', clerkUser.id);

        if (deleteError) {
            console.error('모든 분석 기록 삭제 오류:', deleteError);
            return res.status(500).json({
                success: false,
                message: '모든 분석 기록 삭제 중 오류가 발생했습니다.'
            });
        }

        res.json({
            success: true,
            message: '모든 분석 기록이 성공적으로 삭제되었습니다.',
            deletedCount: existingData.length
        });
    } catch (error) {
        console.error('모든 분석 기록 삭제 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '모든 분석 기록 삭제 중 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    analyzeDocument,
    getDisclosureTypes,
    getAnalysisHistory,
    getAnalysisResult,
    deleteAnalysisResult,
    deleteAllAnalysisResults
}; 
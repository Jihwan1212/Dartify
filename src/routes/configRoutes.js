const express = require('express');
const router = express.Router();

// Clerk Publishable Key 제공
router.get('/clerk-key', (req, res) => {
    try {
        const clerkPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
        
        if (!clerkPublishableKey) {
            return res.status(500).json({
                success: false,
                error: 'Clerk Publishable Key가 설정되지 않았습니다.'
            });
        }
        
        res.json({
            success: true,
            clerkPublishableKey: clerkPublishableKey
        });
    } catch (error) {
        console.error('Clerk 키 제공 중 오류:', error);
        res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;

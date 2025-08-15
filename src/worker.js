import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// CORS 설정
app.use('*', cors({
  origin: ['http://localhost:3001', 'https://dartify.pages.dev'],
  credentials: true
}))

// 정적 파일 제공
app.use('/*', serveStatic({ root: './public' }))

// 기본 라우트
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dartify - 공시 분석 플랫폼</title>
        <link rel="stylesheet" href="/css/style.css">
        <link rel="stylesheet" href="/css/notion-style.css">
    </head>
    <body>
        <div id="app">
            <h1>Dartify</h1>
            <p>공시 분석 플랫폼이 성공적으로 배포되었습니다!</p>
        </div>
        <script src="/js/app.js"></script>
    </body>
    </html>
  `)
})

// API 라우트
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Dartify API is running' })
})

export default app

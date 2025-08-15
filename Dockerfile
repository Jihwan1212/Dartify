# Node.js 18 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 3000

# Healthcheck 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 애플리케이션 시작
CMD ["npm", "start"]

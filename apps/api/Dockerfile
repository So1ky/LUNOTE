# ---- 1단계: 빌드 ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- 2단계: 운영 의존성 ----
# devDependencies(typescript·jest·eslint 등)를 뺀 node_modules.
# prisma CLI는 마이그레이션 Job이, dotenv는 prisma.config.ts가 쓰므로 dependencies에 있다.
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

# ---- 3단계: 실행 ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# Prisma 7: migrate CLI가 datasource.url을 이 파일에서 읽는다 (없으면 migrate deploy 실패)
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./

EXPOSE 3000
# 실제 시작 명령은 compose가 덮어쓴다 (migrate deploy && node ...)
CMD ["node", "dist/src/main.js"]
# admin-web — 멀티스테이지: node로 빌드하고, 결과물(정적 파일)만 caddy로 서빙.
# apps/api/Dockerfile을 직접 작성할 때 이 파일이 참고 예시다 (infra/demo/README.md 3단계).

# ---- 1단계: 빌드 ----
FROM node:22-alpine AS build
WORKDIR /app

# 의존성 레이어 분리 — 소스만 바뀌면 npm ci를 다시 하지 않는다 (빌드 캐시)
COPY package*.json ./
RUN npm ci

COPY . .
# Vite는 빌드 시점에 환경변수를 정적으로 박는다 → build arg로 주입
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- 2단계: 서빙 ----
# 빌드 도구 없는 얇은 이미지 — dist만 담는다
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
RUN printf ':80 {\n\troot * /srv\n\ttry_files {path} /index.html\n\tfile_server\n}\n' > /etc/caddy/Caddyfile

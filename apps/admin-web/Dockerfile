# admin-web — 멀티스테이지: node로 빌드하고, 결과물(정적 파일)만 caddy로 서빙.
# prod 네임스페이스(Pod Security restricted)에서 비root·읽기 전용 루트로 돈다: 8080 포트, 쓰기 경로는 /tmp(emptyDir)뿐.
# 이미지에 USER를 두지 않고 Pod securityContext(runAsUser 1000)로 UID를 정한다 — API 이미지와 같은 방식.

# ---- 1단계: 빌드 ----
FROM node:22-alpine AS build
WORKDIR /app

# 의존성 레이어 분리 — 소스만 바뀌면 npm ci를 다시 하지 않는다 (빌드 캐시)
COPY package*.json ./
RUN npm ci

COPY . .
# Vite는 빌드 시점에 환경변수를 정적으로 박는다 → build arg로 주입 (공개값: API 주소)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- 2단계: 서빙 ----
# 빌드 도구 없는 얇은 이미지 — dist만 담는다
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
# 공식 이미지는 바이너리에 파일 capability(cap_net_bind_service=ep)를 붙여 둔다. Pod가 capabilities drop ALL이면 커널이 그 바이너리의
# exec 자체를 거부한다("operation not permitted", 2026-10-12 첫 배포에서 실측). 8080을 쓰므로 필요 없다 → 떼어낸다.
RUN setcap -r /usr/bin/caddy
# admin off: 관리 API(2019)를 끄고 설정 자동 저장(/config 쓰기)도 하지 않는다. 비root는 1024 미만 포트를 못 연다 → 8080.
RUN printf '{\n\tadmin off\n}\n:8080 {\n\troot * /srv\n\tencode gzip\n\ttry_files {path} /index.html\n\tfile_server\n}\n' > /etc/caddy/Caddyfile
# Caddy의 데이터·설정 저장 경로를 /tmp로 — 루트는 읽기 전용, k8s에서는 /tmp가 emptyDir
ENV XDG_DATA_HOME=/tmp/caddy-data XDG_CONFIG_HOME=/tmp/caddy-config
EXPOSE 8080

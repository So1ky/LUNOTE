# LUNOTE 데모 환경 (VPS 1대)

기획자 원격 데모용. 안드로이드 폰에서 **모바일 웹 / APK / 관리자 대시보드**를 모두 쓸 수 있다.
프로덕션 아님 — 실 운영 인프라는 `docs/ARCHITECTURE.md`의 EKS 트랙.

```
폰(독일) ──HTTPS──> Caddy(자동 인증서) ──┬── api.<도메인>   → NestJS API
                                        ├── admin.<도메인> → 관리자 대시보드
                                        ├── app.<도메인>   → 모바일 웹 (expo export)
                                        └── s3.<도메인>    → MinIO (첨부파일)
```

## 0. 준비물 (계정 3개)

| 무엇 | 어디서 | 용도 |
|---|---|---|
| VPS 1대 (2GB RAM 권장, 월 $5~) | Hetzner / Vultr / DigitalOcean 등 | 데모 서버. Ubuntu 24.04 선택 |
| Brevo 무료 계정 | brevo.com | 가입 인증 메일 실발송 (무료 300통/일) |
| Expo 계정 | expo.dev | 안드로이드 APK 클라우드 빌드 |

## 1. VPS 초기 설정

VPS 생성 후 표시되는 **공인 IP**를 메모한다 (아래에서 `<IP>`).

```sh
ssh root@<IP>   # 첫 접속은 Vultr 콘솔에 표시된 root 비밀번호로

# SSH 키 등록 → (새 터미널에서 키 접속 검증 후) → 비밀번호 로그인 차단
mkdir -p ~/.ssh && echo "<맥의 ~/.ssh/id_ed25519.pub 내용>" >> ~/.ssh/authorized_keys
# ⚠️ 반드시 새 터미널에서 ssh root@<IP>가 비밀번호 없이 되는지 확인한 뒤에 아래 실행
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
grep -rl "PasswordAuthentication yes" /etc/ssh/sshd_config.d/ 2>/dev/null | xargs -r sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/'
systemctl restart ssh

# Docker 설치 (공식 스크립트)
curl -fsSL https://get.docker.com | sh
# 스왑 2GB — 도커 이미지 빌드(npm ci 등)의 순간 메모리 스파이크로 인한 OOM 방지
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab   # 재부팅 후에도 유지
# 코드 가져오기
git clone https://github.com/So1ky/LUNOTE.git && cd LUNOTE/infra/demo
```

## 2. 환경변수

```sh
cp .env.example .env
openssl rand -hex 24   # 3번 실행해서 DB_PASSWORD / MINIO_PASSWORD / JWT_SECRET에
vi .env                # DEMO_DOMAIN=<IP>.sslip.io  + Brevo SMTP 값 채우기
```

`sslip.io`는 무료 와일드카드 DNS다 — `api.<IP>.sslip.io`가 자동으로 `<IP>`로 풀리므로
도메인 구매 없이 서브도메인 + HTTPS(Let's Encrypt)가 동작한다.
`lunote.app` 같은 실제 도메인이 있으면 A 레코드(`api`,`admin`,`app`,`s3` → IP)를 걸고 그걸 써도 된다.

## 3. API Dockerfile 직접 작성하기 (학습 세션)

`apps/api/Dockerfile`을 만든다. **`apps/admin-web/Dockerfile`이 참고 예시**다 — 같은
멀티스테이지 패턴이고, 각 줄의 의미는 이렇다:

- `FROM node:22-alpine AS build` — 빌드 도구가 있는 큰 이미지로 시작. `AS build`는 단계 이름표.
- `COPY package*.json ./` → `RUN npm ci` — **의존성만 먼저** 복사·설치. Docker는 줄 단위로
  캐시하므로, 소스만 바뀐 재빌드에서 이 무거운 단계를 건너뛴다.
- `COPY . .` → 빌드 — 이제 소스 전체를 넣고 컴파일.
- 두 번째 `FROM` — 새 이미지에서 다시 시작하고, 앞 단계에서 **결과물만** `COPY --from=build`.
  빌드 도구·소스가 빠져 이미지가 작고 공격 표면도 줄어든다.

API용으로 다른 점 3가지:
1. Prisma 클라이언트는 `npx prisma generate`로 생성해야 한다 (스키마 복사 후).
2. 실행 단계는 정적 파일이 아니라 node 프로세스 — `CMD ["node", "dist/src/main.js"]`.
3. 마이그레이션 CLI가 필요해서 `node_modules`를 통째로 가져간다 (데모 수준 타협 —
   프로덕션 최적화는 나중에).

이대로 `apps/api/Dockerfile`에 직접 타이핑해 보자:

```dockerfile
# ---- 1단계: 빌드 ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- 2단계: 실행 ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./

EXPOSE 3000
# 실제 시작 명령은 compose가 덮어쓴다 (migrate deploy && node ...)
CMD ["node", "dist/src/main.js"]
```

추가로 `apps/api/.dockerignore`도 만든다 (없으면 node_modules까지 COPY되어 느려진다):

```
node_modules
dist
test
.env*
```

## 4. 스택 기동

```sh
docker compose up -d --build
docker compose logs -f api     # "Nest application successfully started" 확인
```

확인: `https://api.<도메인>/health` → `{"status":"ok","db":"up","queue":"up"}`

## 5. 모바일 웹 배포 (맥에서)

expo 웹은 정적으로 export해서 Caddy가 서빙한다. **API 주소는 export 시점에 박히므로** 먼저 설정:

```sh
cd apps/mobile
EXPO_PUBLIC_API_URL=https://api.<도메인> npx expo export -p web
rsync -av dist/ root@<IP>:~/LUNOTE/infra/demo/mobile-web-dist/
```

→ 폰에서 `https://app.<도메인>` 접속.

## 6. 안드로이드 APK (맥에서)

```sh
cd apps/mobile
npm i -g eas-cli && eas login
eas build -p android --profile preview
```

`eas.json`의 preview 프로필이 API 주소를 읽는다 — 빌드 전에 `eas.json`에서
`EXPO_PUBLIC_API_URL`을 실제 데모 주소로 바꿀 것. 빌드가 끝나면 나오는
**APK 링크를 기획자에게 그대로 전송** (안드로이드에서 링크 열기 → 설치 허용 → 설치).

## 7. 기획자에게 보낼 것

- 앱(웹): `https://app.<도메인>` / 앱(APK): EAS 빌드 링크
- 관리자: `https://admin.<도메인>` + 관리자 계정
  (VPS DB는 비어 있다 — 앱/웹에서 가입한 뒤 VPS에서
  `docker compose exec api npm run promote-admin -- <이메일>` 로 승격)
- 시나리오 예: 가입(실제 메일로 인증코드) → 문의 등록(사진 첨부) → 관리자가 견적 발송
  → 앱에서 알림·견적 확인 → 취소까지. 견적은 발송 후 수정 불가·7일 유효.

## 걷어치우기 / 비용

- 데모 종료: `docker compose down` (데이터 유지) / `docker compose down -v` (전부 삭제)
- VPS는 시간 과금이 대부분 — 데모 끝나면 인스턴스 삭제로 비용 정지.
- 이 환경은 PortOne 심사 때 재사용 예정이라 컴포즈 파일은 레포에 유지한다.

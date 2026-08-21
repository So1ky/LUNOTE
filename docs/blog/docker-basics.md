# [블로그 초안] Dockerfile 처음 쓰면서 이해한 Docker 핵심 개념

> LUNOTE 데모 배포([demo-deploy-notes.md](demo-deploy-notes.md)) 중 API Dockerfile을
> 직접 쓰면서 정리. 진행하며 계속 추가.

## 왜 베이스 이미지가 node인가 — Node vs NestJS vs Next.js

헷갈렸던 것: "내 백엔드는 NestJS인데 왜 `FROM node`지?" (+ NestJS와 Next.js는 이름만
비슷한 남남 — Nest는 백엔드 서버 프레임워크, Next는 React 웹 프론트 프레임워크다.)

층위가 다르다: **NestJS는 코드의 뼈대(프레임워크)**고, TypeScript를 컴파일하면 결국
순수 자바스크립트(dist/)가 나온다. 그 JS를 실행하는 엔진이 **Node.js(런타임)**다.
`FROM node:22-alpine` = "Node 22가 설치된 초경량 리눅스"에서 시작한다는 뜻.
`22`는 Node LTS 버전, `alpine`은 5MB급 경량 리눅스 배포판.

```
NestJS(프레임워크) → 컴파일 → 순수 JS → Node.js(런타임)가 실행 → Alpine Linux(OS)
```

## 이미지 vs 컨테이너

- **이미지**: 실행에 필요한 모든 것(OS 라이브러리+런타임+코드)을 담은 **불변 스냅샷**. 조리법대로 만든 밀키트
- **컨테이너**: 그 이미지를 실제로 **실행 중인 인스턴스**. 같은 이미지로 여러 개 띄울 수 있다
- **Dockerfile**: 이미지를 만드는 조리법

## 기성 이미지 vs 커스텀 빌드 — 전부 컨테이너지만 출처가 다르다

compose의 서비스는 둘 중 하나다:
- `image: postgres:17-alpine` — **기성품 pull**. Postgres/Redis/MinIO/Caddy처럼 전 세계가
  같은 걸 쓰는 소프트웨어는 공식 이미지가 있다. 우리는 env만 주입
- `build: ../../apps/api` — **주문 제작**. 우리가 쓴 코드는 기성 이미지가 없으니
  Dockerfile로 직접 만든다

예외: 정적 파일(expo export한 모바일 웹)은 컨테이너로 만들 필요 없이 Caddy가
볼륨 마운트로 서빙하면 된다.

## 어떤 앱에 Dockerfile이 필요한가 — "어디서 실행되는 코드인가"로 판단

**Dockerfile = 서버에서 24시간 돌아야 하는 프로세스의 포장**이다. LUNOTE 모노레포 기준:

| | 실행 위치 | 최종 산출물 | Dockerfile |
|---|---|---|---|
| apps/api | 우리 서버 | 상주 프로세스 | **필요** |
| apps/mobile | 사용자의 폰 | APK/IPA (EAS가 빌드) | 불필요 — 폰에 도커 없음 |
| 모바일 웹 export | 사용자의 브라우저 | 정적 파일 | 불필요 — 파일은 그냥 서빙 |
| apps/admin-web | 사용자의 브라우저 | 정적 파일 | 선택 (빌드+서빙 포장 편의) |

"API만 특별"한 게 아니라 **서버 상주 프로세스가 API뿐**이라서 생기는 차이.

**데모용 아님**: 프로덕션(EKS)은 쿠버네티스가 컨테이너 이미지를 실행하는 구조라
Dockerfile이 필수다. 지금 쓴 파일이 그대로 `Jenkins 빌드 → ECR push(git SHA 태그) →
ArgoCD 배포` 파이프라인을 탄다. 실배포 전 다듬을 것: node_modules 다이어트,
비루트 유저 실행, HEALTHCHECK 등.

## 이미지 안은 별세계다 — WORKDIR와 COPY

`FROM node:22-alpine`을 쓰는 순간, 이후 명령들은 **레포/호스트와 무관한 미니 리눅스
파일시스템 안에서** 실행된다.

- `WORKDIR /app` = 그 안에 /app을 만들고(없으면 자동 생성) 이후 명령의 기준 디렉토리로.
  레포에 /app 폴더가 없어도 된다 — **이미지 내부 경로**니까. 이름은 관례일 뿐
- `COPY <왼쪽> <오른쪽>` = 유일한 다리. 왼쪽은 내 레포(빌드 컨텍스트), 오른쪽은 이미지 내부
- `CMD ["node", "dist/src/main.js"]`가 통하는 이유: WORKDIR이 /app이라
  실제로는 /app/dist/src/main.js

## 레이어 캐시 — 왜 package.json만 먼저 복사하나

Docker는 Dockerfile **한 줄 한 줄을 레이어로 캐시**하고, 입력이 안 바뀐 줄은 재사용한다.

```dockerfile
COPY package*.json ./   # 의존성 목록만 먼저
RUN npm ci              # ← 소스만 바뀐 재빌드에선 이 무거운 단계가 캐시 히트로 스킵
COPY . .                # 소스는 그 다음에
RUN npm run build
```

순서를 바꿔 `COPY . .`를 먼저 하면 소스 한 글자만 바뀌어도 npm ci부터 다시 — 빌드가
매번 몇 분씩 걸린다. **"자주 바뀌는 것일수록 아래로"**가 Dockerfile 배치의 제1원칙.

## 멀티스테이지 — 빌드 주방과 서빙 접시의 분리

```dockerfile
FROM node:22-alpine AS build   # 1단계: 빌드 도구 다 있는 주방
...빌드...
FROM node:22-alpine            # 2단계: 새 이미지에서 다시 시작
COPY --from=build /app/dist ./dist   # 주방에서 완성품만 가져옴
```

소스·빌드 도구·중간 산출물이 최종 이미지에 안 들어가서 **작고**(전송 빠름),
공격 표면도 줄어든다. LUNOTE API의 타협 하나: 마이그레이션 CLI(prisma)가 필요해서
node_modules를 통째로 복사 — 프로덕션에선 더 다듬을 수 있는 부분.

## .dockerignore

`COPY . .`가 퍼가는 범위에서 제외할 것들 (git의 .gitignore와 같은 개념):
node_modules(이미지 안에서 새로 설치하므로), dist, test, **.env***(시크릿을 이미지에
굽지 않는다 — 이미지는 유출될 수 있는 산출물이다).

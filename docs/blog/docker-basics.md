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

## Node는 프레임워크가 아니다 — 그리고 node_modules의 정체

- **Node.js = 런타임(실행 엔진)**. JS는 원래 브라우저 전용이었는데, 크롬의 V8 엔진을
  떼어내 서버 기능(파일/네트워크)을 붙인 것이 Node — 브라우저 밖에서 JS를 돌리는 표준.
  층위: 언어(JS/TS) → **런타임(Node)** → 프레임워크(NestJS 등). 대안 런타임: Deno, Bun
- **node_modules 삼각관계**: `package.json`(쇼핑 목록) + `package-lock.json`(정확한 버전
  영수증) → `npm ci`가 npmjs(중앙 창고)에서 내려받아 `node_modules/`(장 봐온 재료)를
  **생성**한다. Dockerfile의 `RUN npm ci`가 바로 이 폴더를 만드는 줄
- **왜 복사 안 하고 새로 만드나**: ① 영수증만 있으면 언제든 재생성되는 산출물 (git에도
  안 올리는 이유) ② 일부 패키지는 OS별 컴파일 바이너리 포함 — 맥에서 설치한 걸 리눅스
  이미지에 넣으면 안 돈다. "재료는 현지에서 장 본다"

## 런타임의 정의 / npm ci / 외워야 하나

- **런타임** = 내 코드를 실제로 실행해주고, 실행 중 밑바닥 서비스(기계어 번역, 메모리
  관리·가비지 컬렉션, OS 중개)를 제공하는 프로그램. 코드는 텍스트일 뿐 스스로 못 돈다 —
  악보(코드)를 소리로 만드는 연주자. 언어별: JS→Node, Python→인터프리터, Java→JVM,
  C/Go→기계어 직접 컴파일이라 런타임이 거의 없음(그래서 Go 이미지는 극소형 가능)
- **npm ci vs npm install**: install은 허용 범위(`^`) 안에서 그때그때 최신을 깔고 lock을
  갱신할 수 있다. **ci는 lock 영수증 그대로, 기존 node_modules를 지우고 처음부터** —
  lock 불일치 시 에러, lock 불변. 언제 어디서 빌드해도 같은 결과 → 빌드/CI/도커의 표준
- **외울 건 명령이 아니라 패턴**: Dockerfile은 "새 컴퓨터에서 프로젝트 돌릴 때 치는
  명령들"을 받아 적은 것. `① 의존성 목록 복사 → ② 설치 → ③ 소스 복사+빌드` 구조는
  언어 불문 동일 (Node: package*.json/npm ci, Python: requirements.txt/pip install -r,
  Java: build.gradle/gradle build). ①②를 위에, ③을 아래에 — 캐시 원칙

## 이미지 vs 컨테이너

- **이미지**: 실행에 필요한 모든 것(OS 라이브러리+런타임+코드)을 담은 **불변 스냅샷**. 조리법대로 만든 밀키트
- **컨테이너**: 그 이미지를 실제로 **실행 중인 인스턴스**. 같은 이미지로 여러 개 띄울 수 있다
- **Dockerfile**: 이미지를 만드는 조리법
- 흔한 오해 교정: "빈 컨테이너를 채운다" ❌ — **채우기는 이미지 빌드 때 이미 끝난다.**
  컨테이너 생성 시 정해지는 건 실행 설정(env·포트·볼륨)뿐. 붕어빵: Dockerfile=레시피,
  이미지=다 구워진 붕어빵, 컨테이너=접시에 올려 먹는 중. 그래서 같은 이미지 10개를
  띄우면 완전히 동일한 10개가 즉시 뜬다. 컨테이너의 쓰기 레이어는 삭제 시 소멸 —
  DB 데이터를 volumes로 빼두는 이유

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

## 설정은 이미지에 없다 — 빌드 타임 vs 런타임 주입

compose의 `.env`는 **이미지 빌드에 관여하지 않는다.** compose가 하는 일은 두 단계:
① `build:`로 이미지 생성 (설정 무관) ② 컨테이너 시작 시 `environment:` 값을 프로세스
환경변수로 주입 (NestJS ConfigService가 읽음). 분리하는 이유:
- **같은 이미지, 다른 환경** — 데모에서 검증한 이미지를 프로덕션에 그대로 (주입값만 교체)
- **시크릿 보호** — 이미지는 유출될 수 있는 산출물. 비밀번호를 구우면 안 된다

예외: **정적 웹(admin-web)은 빌드 타임에 굽는다** (`build.args`의 VITE_API_URL) —
정적 파일은 실행 시점에 env를 읽을 프로세스가 없기 때문. 요약:
**서버 앱 = 실행 시 주입, 정적 웹 = 빌드 시 굽기.**

## .dockerignore

`COPY . .`가 퍼가는 범위에서 제외할 것들 (git의 .gitignore와 같은 개념):
node_modules(이미지 안에서 새로 설치하므로), dist, test, **.env***(시크릿을 이미지에
굽지 않는다 — 이미지는 유출될 수 있는 산출물이다).

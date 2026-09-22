# LUNOTE

한국 거주/입국 예정 외국인 대상 컨시어지 플랫폼. **실결제가 발생하는 상용 서비스**, 1인 개발/운영.

모든 아키텍처/기술 결정은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)가 기준.
결정을 바꿀 때는 문서를 먼저 수정한다.

## 확정 스택 (대안 제안 불필요)

NestJS + Prisma + PostgreSQL, Redis/BullMQ, Passport / Expo RN /
EKS(Spot+Karpenter) + Terraform + Jenkins/ArgoCD + Prometheus·Grafana·Loki / PortOne
infra/k8s/가 ArgoCD GitOps 소스다.

**인프라는 아직 미구축이다.** 현재 실제 배포는 `infra/demo/`의 VPS 1대 데모
(docker compose + Caddy)뿐. 구축 순서는 배포 마스터 체크리스트
(`docs/superpowers/plans/` — 로컬 전용, git 추적 제외).

## 로컬 개발 환경 (macOS)

- clone 직후 1회: `sh scripts/setup-hooks.sh` (시크릿 커밋 차단 훅 설치).
- 프로젝트를 iCloud 동기화 폴더(`~/Desktop`, `~/Documents`)에 두지 않는다.
  확장 속성 때문에 iOS codesign이 `resource fork ... not allowed`로 실패한다.
- 셸에 `export LANG=en_US.UTF-8` 필요 — 없으면 `pod install`이
  `Encoding::CompatibilityError`로 죽는다.
- 앱 실행은 Expo Go가 아니라 **개발 빌드**(`npm run ios` = `expo run:ios`).
  PortOne 결제와 Apple 로그인은 네이티브 모듈이라 Expo Go에서 동작하지 않는다.
- API 개발 서버는 기본 **127.0.0.1 바인딩**. 실기기 폰 테스트 시에만
  `HOST=0.0.0.0 npm run start:dev`로 임시 개방.
- **새 네이티브 모듈 설치 후엔 개발 빌드 재빌드(`npm run ios`) 필수.**
  옛 바이너리엔 미링크라 `requireNativeModule('X')`을 import 시점에 실행하는
  모듈(예: expo-localization)은 정적 import만으로도 throw → 화면 전체 크래시.
  당장 재빌드가 곤란하면 지연 `require` + try/catch로 폴백.

## 프로젝트 규칙

- 기존 아키텍처와 패턴 우선. 새 의존성은 추가 전에 필요성과 대안을 설명한다.
- 설정값·비밀값을 코드에 하드코딩하지 않는다. 로그에 개인정보·인증 정보를 남기지 않는다.
- **코드는 실제 운영 환경 기준** — 성능, 동시성, 장애 대응, 보안, 관측 가능성이 기본 고려사항.
- SOLID 준수: 단일 책임(서비스는 한 도메인, 화면은 표시만), NestJS DI,
  확장 포인트는 인터페이스/전략 패턴(알림 채널·스토리지·결제 수단).
  패턴은 필요가 입증될 때 도입. 현재 적용: Guard 체인, BullMQ 생산자-소비자,
  presigned URL, 주문 상태 머신.
- 새 기능의 설계/패턴 선택 근거는 PR 본문에 남긴다.
- 백엔드 코드 리뷰는 `backend-review` 스킬(.claude/skills/backend-review)을 사용한다.

## 절대 규칙

- **시크릿(.env, API 키, 인증서) 커밋 금지.** 원천은 AWS Secrets Manager.
  `.githooks/pre-commit`이 물리적으로 차단한다.
- **JWT 페이로드는 사용자 ID와 role까지만.** 서명될 뿐 암호화되지 않아
  누구나 base64 디코드로 읽을 수 있다.
- AWS 리소스는 Terraform으로만 생성/변경. 콘솔 수동 조작 금지.
- 결제 상태 변경은 반드시 웹훅 + PortOne 조회 API 교차검증 후에만.
  웹훅은 서명 검증 + 이벤트ID UNIQUE 멱등성 처리 필수.
- 이미지 태그는 git SHA. `latest` 금지.

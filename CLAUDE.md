# LUNOTE

한국 거주/입국 예정 외국인 대상 컨시어지 플랫폼. **실결제가 발생하는 상용 서비스**다. 1인 개발/운영.

## 필독

- 모든 아키텍처/기술 결정은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)가 기준이다.
  결정을 바꿀 때는 문서를 먼저 수정한다.
- 사용자와의 대화는 한국어로 한다.

## 확정 스택 요약

- 백엔드: NestJS + Prisma + PostgreSQL, Redis/BullMQ, Passport(Google/Apple + 이메일/비밀번호)
- 앱: React Native (Expo)
- 인프라: AWS EKS(Spot+Karpenter) / Terraform / Jenkins+ArgoCD / Prometheus+Grafana+Loki
- 결제: PortOne — 웹훅은 서명 검증 + 이벤트ID UNIQUE 멱등성 처리 필수

## 디렉토리 구조

```
apps/api/        # NestJS 백엔드
apps/mobile/     # Expo React Native 앱
infra/terraform/ # IaC (envs/prod, modules/)
infra/k8s/       # K8s 매니페스트 (ArgoCD GitOps 소스)
docs/            # 아키텍처, 의사결정 기록
design/          # Figma에서 export한 와이어프레임 PNG
```

## 로컬 개발 환경 (macOS)

- **프로젝트를 iCloud 동기화 폴더(`~/Desktop`, `~/Documents`)에 두지 않는다.**
  iCloud가 파일에 확장 속성을 붙여 iOS 빌드의 codesign이
  `resource fork, Finder information, or similar detritus not allowed`로 실패한다.
- CocoaPods는 UTF-8 로케일이 필요하다. 셸에 `export LANG=en_US.UTF-8`가 있어야
  `pod install`이 `Encoding::CompatibilityError`로 죽지 않는다.
- 앱 실행은 Expo Go가 아니라 **개발 빌드**를 쓴다 (`npm run ios` = `expo run:ios`).
  PortOne 결제와 Apple 로그인은 네이티브 모듈이라 Expo Go에서 동작하지 않는다.
- API 개발 서버는 기본 **127.0.0.1 바인딩** (같은 와이파이 기기로부터 차단).
  실기기 폰 테스트 시에만 `HOST=0.0.0.0 npm run start:dev`로 임시 개방한다.
- **새 네이티브 모듈(`expo-*`, 네이티브 코드 포함 라이브러리)을 설치하면 JS 리로드로는
  안 되고 개발 빌드를 재빌드(`npm run ios`)해야 한다.** 옛 바이너리엔 그 네이티브
  모듈이 링크돼 있지 않아, `requireNativeModule('X')`을 import 시점에 실행하는
  모듈(예: expo-localization)은 정적 import만으로도 throw → 화면이 통째로 죽는다.
  당장 재빌드가 곤란하면 해당 모듈을 지연 `require` + try/catch로 감싸 폴백시킨다.

## 최초 셋업 (clone 직후 1회)

```sh
sh scripts/setup-hooks.sh   # 시크릿 커밋 차단 훅 설치 (git hook은 clone에 포함되지 않음)
```

## 프로젝트 개발 규칙

- 기존 아키텍처와 패턴을 우선 사용한다.
- 새로운 의존성을 추가하기 전에 필요성과 대안을 설명한다.
- 설정값과 비밀값을 코드에 하드코딩하지 않는다.
- 로그에 개인정보와 인증 정보를 남기지 않는다.
- 변경 후 빌드와 테스트를 실행하고 결과를 보고한다.
- **코드는 실제 운영 환경 기준으로 작성한다** — 성능, 동시성, 장애 대응, 보안,
  관측 가능성을 기본 고려사항으로 삼는다.
- 기획 의도가 모호하면 구현 전에 사용자에게 질문한다.
- 백엔드 코드 리뷰는 `backend-review` 스킬(.claude/skills/backend-review)을 사용한다.

## 코드 작성 원칙 (SOLID / 유지보수성 — 프로젝트 원칙)

- **SOLID를 지킨다.** 단일 책임(서비스는 한 도메인, 화면은 표시만), 의존성 주입(NestJS DI),
  개방-폐쇄(확장 포인트는 인터페이스/전략 패턴 — 알림 채널·스토리지·결제 수단).
- 검증된 패턴을 쓰되 **필요가 입증될 때 도입** (과잉 설계 금지).
  현재 적용: Guard 체인, 큐 기반 생산자-소비자(BullMQ), presigned URL, 주문 상태 머신.
- 새 기능의 설계/패턴 선택 근거는 PR 본문에 남긴다.

## 절대 규칙

- **시크릿(.env, API 키, 인증서)을 커밋하지 않는다.** 시크릿은 AWS Secrets Manager가 원천.
  `.githooks/pre-commit`이 물리적으로 차단한다.
- **JWT 페이로드에 민감정보를 넣지 않는다.** JWT는 서명될 뿐 암호화되지 않아
  페이로드는 누구나 base64 디코드로 읽을 수 있다. 사용자 ID와 role까지만.
- AWS 리소스는 Terraform으로만 생성/변경한다. 콘솔 수동 조작 금지.
- 결제 상태 변경은 반드시 웹훅 + PortOne 조회 API 교차검증 후에만.
- 이미지 태그에 `latest` 사용 금지 (git SHA 태그).

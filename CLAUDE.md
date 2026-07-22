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

## 최초 셋업 (clone 직후 1회)

```sh
sh scripts/setup-hooks.sh   # 시크릿 커밋 차단 훅 설치 (git hook은 clone에 포함되지 않음)
```

## 절대 규칙

- **시크릿(.env, API 키, 인증서)을 커밋하지 않는다.** 시크릿은 AWS Secrets Manager가 원천.
  `.githooks/pre-commit`이 물리적으로 차단한다.
- **JWT 페이로드에 민감정보를 넣지 않는다.** JWT는 서명될 뿐 암호화되지 않아
  페이로드는 누구나 base64 디코드로 읽을 수 있다. 사용자 ID와 role까지만.
- AWS 리소스는 Terraform으로만 생성/변경한다. 콘솔 수동 조작 금지.
- 결제 상태 변경은 반드시 웹훅 + PortOne 조회 API 교차검증 후에만.
- 이미지 태그에 `latest` 사용 금지 (git SHA 태그).

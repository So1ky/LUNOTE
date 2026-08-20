# [블로그 초안] 1인 개발 서비스, 월 $10 VPS로 원격 데모 환경 만들기

> 이 문서는 블로그 포스팅용 원재료다. 배포를 진행하며 계속 갱신한다.
> `[📸 스크린샷: ...]` 표시 = 그 시점에 찍어둔 화면을 삽입할 자리.
> 목표: 나중에 이 글만 보고 처음부터 끝까지 똑같이 재현할 수 있을 것.

## 1. 배경 — 왜 필요했나

- LUNOTE(외국인 대상 컨시어지 앱)를 로컬(맥북)에서만 개발해왔다.
- 독일에 있는 기획자에게 **안드로이드 폰으로** 앱과 관리자 대시보드를 보여주고
  e2e 테스트(가입→문의→견적→확인)까지 시켜야 하는 상황.
- 로컬 서버는 ① 맥을 덮으면 꺼지고 ② 공유기 뒤라 외부에서 접근할 주소가 없다.
  → **인터넷에 항상 떠 있는 서버**가 필요하다.

## 2. 선택지 비교 — 어디에 띄울까

| 선택지 | 판단 |
|---|---|
| 풀 AWS (EKS+RDS+...) | 프로덕션 계획이지만 데모엔 과잉. 고정비 $150~250/월, 구축도 큰 작업 |
| Cloudflare Tunnel (로컬 노출) | 무료·즉시. 그러나 맥이 켜져 있어야만 동작 — 시차 있는 원격 데모에 부적합 |
| **VPS 1대 + docker compose** | **채택.** 월 $10, 상시 접근, 나중에 PortOne 심사 환경으로 재활용 |

교훈: "데모/심사용 환경"과 "프로덕션 인프라"는 분리한다. 데모는 지워도 되는 값싼 것으로.

### VPS 업체 비교

| | Hetzner | **Vultr (채택)** | DigitalOcean | Oracle 무료 |
|---|---|---|---|---|
| 2GB급 가격 | ~$4.6 (4GB!) | ~$10 | ~$12 | 무료 |
| 한국 리전 | 없음 (싱가포르) | **서울 있음** | 없음 (프랑크푸르트 등) | 있음 |
| 가입 | 신분증 검증 걸릴 수 있음 | **카드만, 즉시** | 쉬움 | 험난+계정정지 사례 |

- 처음엔 "기획자가 독일에 있으니 독일 리전(Hetzner)"을 고려했으나, 기획자가 9월에
  귀국 예정 → 이후 사용자·PortOne 심사가 전부 한국 → **Vultr 서울**로 결정.
- 지금 독일에서 서울 서버 접속은 왕복 ~250ms — 화면당 API 1~2회 호출이라 데모에 지장 없음.

## 3. Vultr 인스턴스 생성 — 선택한 값과 이유

`[📸 스크린샷: Cloud Compute Regular Performance 요금표]`
`[📸 스크린샷: Plan Selection에서 vc2-1c-2gb 선택 + Summary(Seoul)]`

| 항목 | 선택 | 이유 |
|---|---|---|
| 종류 | Shared CPU (Cloud Compute) | 데모 트래픽에 전용 CPU는 낭비 |
| 플랜 | **vc2-1c-2gb** (1vCPU/2GB, $10/월) | 스택 상주 메모리 ~700MB + **서버에서 도커 빌드 시 스파이크** 고려. 1GB는 npm ci/tsc 빌드 중 OOM 위험 |
| 리전 | Seoul | 위 비교 참고 |
| OS | **Ubuntu 24.04 LTS x64** | "충분히 새롭고 충분히 검증된" 최신 성숙 LTS. 22.04는 지원 1년 미만 남음, 26.04는 출시 4개월(트러블슈팅 자료 부족) |
| SSH Keys | **맥의 공개키 등록** | 비밀번호보다 안전 + 이후 rsync 배포에 필요. `ssh-keygen -t ed25519`로 생성, `~/.ssh/id_ed25519.pub` 내용 붙여넣기. **함정: 배포 폼의 드롭다운은 선택만 가능** — Account → Settings → SSH Keys에서 먼저 등록해야 목록에 뜬다 (등록 후 배포 페이지 새로고침) |
| Startup Script | 안 씀 | 초기 설정을 손으로 하며 배우는 게 목적 (내용은 §4) |
| Firewall Group | 안 씀 (기본) | compose가 80/443만 호스트에 노출, DB/Redis는 내부망 전용이라 기본으로도 안전. 나중에 22/80/443 허용 그룹으로 조이면 더 좋음 |
| Hostname / Label | `lunote-demo` | 콘솔에서 알아보기 위한 이름일 뿐 |
| Connectivity | Public IP + **IPv4 필수** | sslip.io 도메인·Let's Encrypt·폰 접속 모두 IPv4 기준. IPv6-only는 불가 |
| VPC Network | OFF | 서버 1대뿐 — 사설망 쓸 일 없음 |
| Serverless Inference | **OFF** | Vultr의 LLM API 상품 — 우리와 무관. 켜면 토큰 종량 과금 |
| Automatic Backups | **OFF** ($2 절약) | 데모 데이터는 날아가도 됨. 코드/설정은 전부 git — 서버가 사라져도 README로 20분 재구축 |
| DDoS Protection | **OFF** ($10 절약) | 데모 서버에 과잉 |
| Limited User Login | OFF | 데모는 root로 단순하게 (프로덕션이면 별도 사용자 + sudo가 정석) |
| Cloud-Init User Data | OFF | Startup Script와 같은 이유 |

`[📸 스크린샷: Server Settings / Additional Features 화면]`

월 비용: **$10.00** (부가 기능 전부 끄면 딱 플랜 가격만 나온다.
백업 $2, DDoS $10 같은 애드온이 기본 켜져 있는 경우가 있으니 Summary에서 확인할 것.)

## 4. 서버 초기 설정

> 여기부터는 infra/demo/README.md의 단계를 따른다. 실제 진행하며 기록 추가 예정.

- [ ] ssh 접속 → Docker 설치 → 스왑 2GB (빌드 OOM 방지)
- [ ] .env 작성 (DEMO_DOMAIN=<IP>.sslip.io, 시크릿 3종, Brevo SMTP)
- [ ] apps/api/Dockerfile 직접 작성 (멀티스테이지 — admin-web/Dockerfile 참고)
- [ ] docker compose up -d --build → /health 확인
- [ ] 모바일 웹 expo export 업로드
- [ ] EAS로 안드로이드 APK 빌드 → 링크 공유
- [ ] 기획자 계정 가입(Brevo 실메일 인증) + 관리자 승격

## 부록 — 이번에 배운 개념 한 줄 정리

- **VPS**: 공인 IP 달린 24시간 빌린 컴퓨터 (월세 원룸)
- **Caddy**: 서브도메인별 트래픽 안내 + HTTPS 인증서 자동 발급/갱신 (안내 데스크)
- **sslip.io**: `api.<IP>.sslip.io`처럼 이름에 IP를 넣으면 그 IP로 풀어주는 무료 DNS — 도메인 구매 불필요
- **CORS**: "이 웹 출처에서 온 요청은 허용"을 API가 선언 — 관리자웹→API 호출에 필요 (네이티브 앱은 해당 없음)
- **Brevo**: 인증 메일 실발송용 SMTP 서비스 (로컬 Mailpit은 배달 안 되는 개발용 가짜 우체국)
- **SSH 키**: `ssh-keygen -t ed25519` 한 줄로 생성되는 도장(개인키, 유출 금지)+견본(공개키, 공개 OK) 쌍.
  서버엔 견본만 올리고, 접속 시 개인키로 수학 퀴즈를 풀어 증명 — 비밀이 네트워크를 타지 않아
  비밀번호와 달리 도청·무차별 대입이 통하지 않는다. GitHub SSH 인증도 같은 원리.
  → 상세(옵션·원리·키 종류 비교·passphrase)는 별도 문서: [ssh-keys.md](ssh-keys.md)
- **스왑**: 디스크를 임시 메모리로 — 작은 서버에서 빌드 순간 스파이크 버티기
- **presigned URL 함정**: URL에 S3 endpoint 주소가 박히므로 localhost면 원격에서 업로드 불가 — 공개 URL로 설정해야 함

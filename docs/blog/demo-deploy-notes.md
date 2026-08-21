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
| SSH Keys | 폼에서는 비워둠 → **서버 생성 후 안에서 등록** | 폼의 드롭다운은 계정에 선등록한 키를 고르는 것뿐인데 등록 메뉴를 못 찾아서, 더 간단한 경로로 변경: 키 없이 생성 → Vultr가 만들어준 root 비밀번호로 첫 접속 → `~/.ssh/authorized_keys`에 공개키 추가 → 이후 비밀번호 없이 접속. 결과는 동일 ([ssh-keys.md](ssh-keys.md) §3 수동 등록) |
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

## 3.5 Brevo 셋업 — 가입 인증 메일을 진짜로 배달하기

로컬에서는 인증 코드 메일이 Mailpit(배달 안 되는 개발용 가짜 우체국)에 쌓였다.
원격 데모에서는 기획자의 실제 메일함까지 배달돼야 하므로 발송 서비스가 필요하다.
**Brevo 무료 플랜(일 300통)** 선택 — 코드는 표준 SMTP라서 한 줄도 안 바꾸고
`.env`의 접속 정보만 교체하면 된다.

`[📸 스크린샷: Brevo SMTP & API 화면]`

**가입**: Organization은 검증 안 하지만 "LUNOTE"처럼 실제 프로젝트명 권장 —
Brevo가 스팸 계정을 심사하므로 정체불명 값은 계정이 막힐 확률을 높인다.

**SMTP 키 발급**: SMTP & API 메뉴 → "Generate SMTP key". **키는 생성 직후 한 번만
표시**되므로 그 자리에서 복사해 비밀번호 관리자에 보관. 화면의 값 → `.env` 매핑:

| .env | 값 |
|---|---|
| `SMTP_HOST` | smtp-relay.brevo.com |
| `SMTP_PORT` | 587 |
| `SMTP_USER` | 화면의 Login (예: `b62xxxxx@smtp-brevo.com`) |
| `SMTP_PASS` | 생성한 SMTP key |

**건너뛴 것**: "Activate for SMTP keys"(허가된 IP만 발송) 배너 — 발송 IP(VPS)가
아직 없어서 지금 켜면 나중에 메일이 안 나가는 원인이 된다. 데모 안정화 후 VPS IP
등록하고 켜면 보안 보너스.

**발신자 인증 (헷갈리는 포인트 — 인증이 두 종류다)**:
- ① **발신자 인증**: Brevo에게 "이 FROM 주소의 주인이 나"임을 증명하는 **1회성 설정**.
  Senders → Add a sender에 본인 이메일 등록·확인. 안 하면 발송 자체가 거부된다.
  도메인 미보유 시 개인 이메일로 인증하고 `MAIL_FROM=LUNOTE <본인주소>` — 수신자에겐
  "LUNOTE"로 표시된다.
- ② **가입 인증 코드 메일**: 데모 중 실제로 오가는 것. 기획자 가입 → API가 6자리 코드
  생성 → Brevo 경유 → 기획자 메일함. ①은 ②를 가능하게 하는 사전 준비다.

## 4. 서버 초기 설정

> 여기부터는 infra/demo/README.md의 단계를 따른다. 실제 진행하며 기록 추가 예정.

- [ ] ssh 첫 접속(root 비밀번호) → **일반 유저 생성**(adduser + sudo 그룹, root 상시 사용 금지)
      → 유저에게 공개키 등록(chown/chmod 700·600 주의) → **새 터미널에서 키 접속 검증**
      → `PermitRootLogin no` + `PasswordAuthentication no` (sshd_config.d의 cloud-init
      오버라이드도 확인 — 순서 틀리면 자기 서버에서 잠긴다. 비상구는 Vultr 웹 콘솔).
      docker 그룹 추가는 sudo 생략용이지만 사실상 root 동급 권한임을 인지하고 쓸 것
- [ ] Docker 설치 → 스왑 2GB (빌드 OOM 방지)
  - 트러블슈팅: `fallocate failed: Text file busy` = **이미 스왑으로 활성화된 파일을
    다시 만들려는 것**. 원인: **Vultr Ubuntu 이미지가 처음부터 5.3G 스왑을 만들어둠** —
    `swapon --show`로 먼저 확인했으면 이 단계 자체가 불필요했다. 기존 스왑은 그대로 쓰면
    된다(스왑은 커도 안 쓰면 비용 없음, 디스크 점유뿐). 교훈: 만들기 전에 현황 확인.
    `&&` 체인에서 sudo는 첫 명령에만 적용되는 것도 주의.
  - 실제 선택: 기존 5.3G를 지우고 2G로 재생성 (`swapoff` → `rm` → 재생성). 디스크 3.3G 회수.
    이때 fstab에 옛 스왑 줄이 남으면 재부팅 시 문제되므로 `grep swap /etc/fstab`으로
    한 줄만 남았는지 확인
- [ ] .env 작성 (DEMO_DOMAIN=<IP>.sslip.io, 시크릿 3종, Brevo SMTP)
- [x] apps/api/Dockerfile 직접 작성 완료 (PR #71) — 개념 정리는 [docker-basics.md](docker-basics.md).
      로컬 `docker build` 검증 통과 후 커밋
- [x] docker compose up -d --build → **https://api.<IP>.sslip.io/health 200 확인** (2026-08-21)
  - 트러블슈팅 3: 컨테이너는 Up인데 502 + 흰 화면 — 502는 "Caddy까지는 정상, 뒤(upstream)가
    안 받는다"는 뜻. `docker compose ps`를 다시 보니 api만 **Restarting** 루프.
    로그 확인: `prisma migrate deploy`가 "datasource.url property is required" 실패.
    **Prisma 7은 DB 연결 정보를 prisma.config.ts에서 읽는데 Dockerfile 실행 단계에 이 파일을
    복사 안 했던 것** (PR #73). 교훈: ① 이미지는 COPY한 것만 존재하는 세계 — 로컬에서 되는
    이유는 레포 전체가 있기 때문 ② "Up인데 안 됨"이면 ps 상태(Restarting?)와 logs부터
  - 트러블슈팅 1: `DEMO_DOMAIN is missing a value` — compose 파일이 아니라 **.env가 없던 것**.
    compose는 실행 디렉토리의 .env를 자동으로 읽어 `${...}`를 치환하고, `${VAR:?}` 문법은
    "값 없으면 시작 거부"라는 의도된 안전장치다. `.env`는 숨김 파일이라 `ls -a`로 확인
  - 트러블슈팅 2: 서버 빌드에서 TS2352 (Redis ping 타입 단언) — 로컬에선 통과하던 컴파일이
    서버 도커 빌드에서 실패. 겹치는 속성 없는 타입 단언은 `as unknown as`로 경유해야
    모든 환경에서 결정적 (PR #72). 교훈: "로컬에서 되는데"를 없애는 게 도커의 목적인 만큼,
    빌드는 환경 차에 민감한 코드가 없어야 한다
- [ ] 모바일 웹 expo export 업로드
  - 트러블슈팅 4: app 도메인 404(0바이트) 흰 화면 — **bind mount 폴더를 docker가 root
    소유로 자동 생성**해서 rsync가 쓸 수 없었다 (`ls -la`로 소유자 root + 빈 폴더 확인).
    해결: `sudo chown -R <유저>:<유저> mobile-web-dist` 후 재rsync. 교훈: compose up 전에
    마운트할 호스트 폴더를 미리 만들어두면 이 문제가 없다. 참고로 흰 화면도 종류가 있다 —
    502(업스트림 다운)와 404(파일 없음)는 원인이 완전히 다르므로 curl로 상태코드부터
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
- **usermod -aG**: `-G`는 보조 그룹 목록 지정, `-a`는 기존 유지+추가. **`-a` 없이 `-G`만 쓰면
  나열 안 한 그룹에서 전부 탈퇴되는 교체 동작**(sudo 그룹에서 빠지는 사고의 단골 원인) —
  항상 세트로. 적용은 재로그인 후 (`id <유저>`로 확인)
- **스왑**: 디스크를 임시 메모리로 — 작은 서버에서 빌드 순간 스파이크 버티기
- **presigned URL 함정**: URL에 S3 endpoint 주소가 박히므로 localhost면 원격에서 업로드 불가 — 공개 URL로 설정해야 함
- **Expo 멀티플랫폼**: 코드 한 벌 → iOS/Android/웹 세 출력 (RN이 네이티브로, react-native-web이 HTML로 변환).
  웹 export는 로컬 node_modules의 CLI가, APK는 EAS 클라우드가 빌드 — 맥에 Android Studio 없이 APK가 나오는 이유

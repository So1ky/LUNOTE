# LUNOTE

한국 거주/입국 예정 외국인 대상 컨시어지 플랫폼. **실결제가 발생하는 상용 서비스**다. 1인 개발/운영.

## 필독

- 모든 아키텍처/기술 결정은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)가 기준이다.
  결정을 바꿀 때는 문서를 먼저 수정한다.
- 사용자와의 대화는 한국어로 한다.

## 확정 스택 요약

- 백엔드: NestJS + Prisma + PostgreSQL, Redis/BullMQ, Passport(Google/Apple)
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

## 절대 규칙

- **시크릿(.env, API 키, 인증서)을 커밋하지 않는다.** 시크릿은 AWS Secrets Manager가 원천.
- AWS 리소스는 Terraform으로만 생성/변경한다. 콘솔 수동 조작 금지.
- 결제 상태 변경은 반드시 웹훅 + PortOne 조회 API 교차검증 후에만.
- 이미지 태그에 `latest` 사용 금지 (git SHA 태그).

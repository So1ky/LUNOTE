# LUNOTE

한국 거주/입국 예정 외국인을 위한 컨시어지 플랫폼.
언어 장벽 없이 주거·비자·병원 등 생활 문제를 문의하고, 견적을 받아 해외 카드로 결제할 수 있다.

**아키텍처와 기술 의사결정은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 기준으로 한다.**

## 기술 스택

- **Backend**: NestJS · Prisma · PostgreSQL · Redis/BullMQ
- **Mobile**: React Native (Expo)
- **Infra**: AWS EKS (Karpenter/Spot) · Terraform · Jenkins + ArgoCD (GitOps)
- **Observability**: Prometheus · Grafana · Loki
- **Payment**: PortOne

## 디렉토리 구조

```
apps/
  api/         # NestJS 백엔드
  mobile/      # Expo React Native 앱
infra/
  terraform/   # IaC — envs/prod, modules/
  k8s/         # K8s 매니페스트 (ArgoCD GitOps 소스)
docs/          # 아키텍처, 의사결정 기록
design/        # Figma에서 export한 와이어프레임
```

## 브랜치 전략

| 브랜치 | 역할 |
|---|---|
| `main` | 프로덕션. ArgoCD 배포 기준. 직접 커밋 금지 — `develop`에서 PR로만 병합 |
| `develop` | 통합 브랜치. feature 브랜치들이 모이는 곳 |
| `feature/<이슈>-<설명>` | 기능 단위 작업 (예: `feature/12-portone-webhook`) |
| `fix/<설명>` | 버그 수정 |

플로우: `feature/*` → PR → `develop` → 검증 후 PR → `main` → 자동 배포

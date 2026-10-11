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
| `develop` | 통합 브랜치이자 **배포 기준**. feature 브랜치들이 모이는 곳. staging은 CI가 자동 배포, prod는 승격 PR(아래) |
| `main` | 배포에 쓰이지 않는다. 승격 PR의 대상이 아니다 (ARCHITECTURE §9 — main 추적은 버렸다) |
| `feature/<이슈>-<설명>` | 기능 단위 작업 (예: `feature/12-portone-webhook`) |
| `fix/<설명>` | 버그 수정 |

플로우: `feature/*` → PR → `develop` → Jenkins가 staging 자동 배포 → 검증 후 **prod 승격 PR(`develop` 대상)**
— `infra/k8s/workloads/api/overlays/prod/kustomization.yaml`의 base ref·newTag 두 줄 (절차: `infra/k8s/README.md` "prod 승격")

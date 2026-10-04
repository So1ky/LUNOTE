# AWS Load Balancer Controller (수동 설치 — Phase 3-3에서 ArgoCD 인수 예정)

- 차트: `eks/aws-load-balancer-controller` **버전 3.5.0** (앱 v3.5.0, 설치일 2026-10-04)
- IRSA 롤·정책: `infra/terraform/envs/prod/lbc.tf` (정책 JSON은 `policies/`에 앱 버전과 동기 커밋)

## 설치/업그레이드

    helm repo add eks https://aws.github.io/eks-charts && helm repo update
    helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
      --version 3.5.0 --namespace kube-system -f values.yaml --wait

차트 업그레이드 시 앱 버전에 맞춰 policies/의 iam_policy.json도 갱신 후 terraform apply.

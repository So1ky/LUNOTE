# AWS Load Balancer Controller (ArgoCD 관리 — `infra/k8s/apps/aws-load-balancer-controller.yaml`)

- 차트: `eks/aws-load-balancer-controller` **버전 3.5.0** (앱 v3.5.0)
- IRSA 롤·정책: `infra/terraform/envs/prod/lbc.tf` (정책 JSON은 `policies/`에 앱 버전과 동기 커밋)

변경은 values.yaml이나 `apps/aws-load-balancer-controller.yaml`의 `targetRevision`을 고쳐 PR로 한다.
차트 업그레이드 시 앱 버전에 맞춰 policies/의 iam_policy.json도 갱신 후 terraform apply.
웹훅 인증서는 차트가 렌더링마다 새로 만들기 때문에 Application에서 `ignoreDifferences`로 제외했다.

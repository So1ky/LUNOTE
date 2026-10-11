# Karpenter (ArgoCD 관리 — `infra/k8s/apps/karpenter.yaml`)

- 차트: `oci://public.ecr.aws/karpenter/karpenter` **버전 1.14.1**
  — K8s 지원 상한 1.36 (클러스터 버전 1.36 결정 근거)
- AWS측 리소스(IRSA 롤·노드 롤·인터럽션 SQS)는 `infra/terraform/envs/prod/karpenter.tf`

변경은 이 디렉터리의 파일이나 `apps/karpenter.yaml`의 `targetRevision`을 고쳐 PR로 한다 (`infra/k8s/README.md`).
values.yaml의 role-arn·interruptionQueue는 `terraform output`과 일치해야 한다.

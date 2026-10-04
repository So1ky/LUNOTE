# Karpenter (수동 설치 — Phase 3-3에서 ArgoCD 인수 예정)

- 차트: `oci://public.ecr.aws/karpenter/karpenter` **버전 1.14.1** (설치일 2026-10-04)
  — K8s 지원 상한 1.36 (클러스터 버전 1.36 결정 근거)
- AWS측 리소스(IRSA 롤·노드 롤·인터럽션 SQS)는 `infra/terraform/envs/prod/karpenter.tf`

## 설치/업그레이드

    helm upgrade --install karpenter oci://public.ecr.aws/karpenter/karpenter \
      --version 1.14.1 --namespace karpenter --create-namespace \
      -f values.yaml --wait
    kubectl apply -f ec2nodeclass.yaml -f nodepool.yaml

values.yaml의 role-arn·interruptionQueue는 `terraform output`과 일치해야 한다.

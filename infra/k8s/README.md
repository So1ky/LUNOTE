# infra/k8s — ArgoCD GitOps 소스

이 디렉터리가 클러스터 내부 상태의 단일 기준이다. `develop`에 머지되면 ArgoCD가 반영한다.
AWS 리소스(IAM 롤 등)는 `infra/terraform/`.

    bootstrap/root-app.yaml   App of Apps 루트 — 유일하게 kubectl로 직접 적용
    apps/                     Application 1개 = 파일 1개 (루트가 감시)
    platform/<컴포넌트>/       차트 values와 매니페스트

| Application | 소스 | 차트 버전 |
|---|---|---|
| argocd | argo/argo-cd + platform/argocd/values.yaml | 10.9.6 |
| karpenter | public.ecr.aws/karpenter + platform/karpenter/ | 1.14.1 |
| aws-load-balancer-controller | eks/aws-load-balancer-controller + values | 3.5.0 |
| external-secrets | external-secrets/external-secrets + values | 2.11.0 |
| storage | platform/storage/ | — |
| namespaces | platform/namespaces/ | — |

## 변경 방법

values·매니페스트·차트 버전(`apps/*.yaml`의 `targetRevision`)을 고쳐 PR → develop 머지. `helm upgrade`를
직접 실행하지 않는다(ArgoCD selfHeal이 되돌린다). 자동 prune은 꺼져 있다 — 리소스를 지우려면 git에서
제거한 뒤 ArgoCD UI에서 해당 리소스를 수동 삭제한다.

## 접속 (외부 노출 없음)

    kubectl --context lunote port-forward svc/argocd-server -n argocd 8080:443
    # https://localhost:8080, 계정 admin

## 부트스트랩 / 재해복구 (빈 클러스터에서)

    helm repo add argo https://argoproj.github.io/argo-helm && helm repo update
    helm install argocd argo/argo-cd --version 10.9.6 -n argocd --create-namespace \
      -f platform/argocd/values.yaml
    kubectl apply -f bootstrap/root-app.yaml
    # 전 Application이 Synced/Healthy가 되면 helm 릴리스 기록을 지운다(이후 ArgoCD가 관리)
    kubectl delete secret -n argocd -l owner=helm,name=argocd

## 새 플랫폼 컴포넌트 추가 시

- 파드는 코어 노드에 고정: `nodeAffinity karpenter.sh/nodepool DoesNotExist`.
- 코어 노드에는 `lunote-app` SG가 없다 — RDS/Redis에 접속해야 하는 파드는 Karpenter 노드에 둔다.
- 차트 기반이면 `syncOptions: [ServerSideApply=true]`.

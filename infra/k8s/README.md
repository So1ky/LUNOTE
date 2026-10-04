# infra/k8s — ArgoCD GitOps 소스

이 디렉터리가 클러스터 내부 상태의 단일 기준이다. `develop`에 머지되면 ArgoCD가 반영한다.
AWS 리소스(IAM 롤 등)는 `infra/terraform/`.

    bootstrap/root-app.yaml   App of Apps 루트 — 유일하게 kubectl로 직접 적용
    apps/                     Application 1개 = 파일 1개 (루트가 감시)
    platform/<컴포넌트>/       차트 values와 매니페스트
    workloads/<앱>/base        환경 공통 매니페스트 (Kustomize)
    workloads/<앱>/overlays/<env>   환경별 설정·이미지 태그·Ingress·ExternalSecret

| Application | 소스 | 차트 버전 |
|---|---|---|
| argocd | argo/argo-cd + platform/argocd/values.yaml | 10.9.6 |
| karpenter | public.ecr.aws/karpenter + platform/karpenter/ | 1.14.1 |
| aws-load-balancer-controller | eks/aws-load-balancer-controller + values | 3.5.0 |
| external-secrets | external-secrets/external-secrets + values | 2.11.0 |
| storage | platform/storage/ | — |
| namespaces | platform/namespaces/ | — |
| api-staging | workloads/api/overlays/staging | — |

## 변경 방법

values·매니페스트·차트 버전(`apps/*.yaml`의 `targetRevision`)을 고쳐 PR → develop 머지. `helm upgrade`를
직접 실행하지 않는다(ArgoCD selfHeal이 되돌린다). 자동 prune은 꺼져 있다 — 리소스를 지우려면 git에서
제거한 뒤 ArgoCD UI에서 해당 리소스를 수동 삭제한다.

## 배포 (이미지 태그 변경)

`workloads/api/overlays/<env>/kustomization.yaml`의 `newTag`를 ECR에 있는 git SHA로 바꿔 PR → develop 머지.
ArgoCD가 ExternalSecret → 마이그레이션 Job → Deployment 순으로 동기화하고, 마이그레이션이 실패하면 롤아웃하지 않는다.
롤백은 태그 커밋 revert. (Phase 4부터 staging 태그는 CI가 갱신한다.)

워크로드 파드는 Karpenter 노드에 둔다(`nodeSelector karpenter.sh/nodepool: default`). 네임스페이스는 기본 거부라
새 워크로드는 자기 NetworkPolicy가 있어야 통신할 수 있다.

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

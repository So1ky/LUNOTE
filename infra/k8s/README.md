# infra/k8s — ArgoCD GitOps 소스

이 디렉터리가 클러스터 내부 상태의 단일 기준이다. `develop`에 머지되면 ArgoCD가 반영한다.
AWS 리소스(IAM 롤 등)는 `infra/terraform/`.

    bootstrap/root-app.yaml   App of Apps 루트 — 유일하게 kubectl로 직접 적용
    apps/                     Application 1개 = 파일 1개 (루트가 감시)
    platform/<컴포넌트>/       차트 values와 매니페스트
    workloads/<앱>/base        환경 공통 매니페스트 (Kustomize)
    workloads/<앱>/overlays/<env>   환경별 설정·이미지 태그·Ingress·ExternalSecret
    ../../Jenkinsfile, ../../ci/    API CI 파이프라인과 빌드 Pod (Jenkins가 읽는다)

| Application | 소스 | 차트 버전 |
|---|---|---|
| argocd | argo/argo-cd + platform/argocd/values.yaml | 10.9.6 |
| karpenter | public.ecr.aws/karpenter + platform/karpenter/ | 1.14.1 |
| aws-load-balancer-controller | eks/aws-load-balancer-controller + values | 3.5.0 |
| external-secrets | external-secrets/external-secrets + values | 2.11.0 |
| storage | platform/storage/ | — |
| namespaces | platform/namespaces/ | — |
| api-staging | workloads/api/overlays/staging | — |
| jenkins | jenkins/jenkins + platform/jenkins/values.yaml | 5.9.65 |

## 변경 방법

values·매니페스트·차트 버전(`apps/*.yaml`의 `targetRevision`)을 고쳐 PR → develop 머지. `helm upgrade`를
직접 실행하지 않는다(ArgoCD selfHeal이 되돌린다). 자동 prune은 꺼져 있다 — 리소스를 지우려면 git에서
제거한 뒤 ArgoCD UI에서 해당 리소스를 수동 삭제한다.

## 배포 (staging은 자동)

`apps/api/`가 바뀐 커밋이 develop에 들어가면 GitHub 웹훅이 Jenkins를 깨워 lint → test → e2e → 이미지 빌드 →
Trivy 스캔 → ECR push를 하고, `workloads/api/overlays/staging/kustomization.yaml`의 `newTag`를 커밋한다
(`chore(deploy): staging API 이미지 <SHA>`, 작성자 lunote-ci). ArgoCD가 그 커밋을 보고 ExternalSecret →
마이그레이션 Job → Deployment 순으로 동기화한다. 마이그레이션이 실패하면 롤아웃하지 않는다.

파이프라인은 저장소 루트 `Jenkinsfile`, 빌드 Pod는 `ci/api-build-pod.yaml`. 어느 단계든 실패하면 이미지는
ECR에 올라가지 않는다. `apps/api/` 밖만 바뀐 커밋은 "변경 확인" 단계에서 끝난다.

### prod 승격 (Phase 5-1에서 overlay 추가 후)

staging에서 확인한 SHA를 `workloads/api/overlays/prod/kustomization.yaml`의 `newTag`에 넣는 PR을 만들고
사람이 머지한다. CI는 prod 태그를 건드리지 않는다. 승격할 SHA는 staging의 현재 값을 그대로 쓴다
(같은 이미지를 다시 빌드하지 않는다).

### 롤백

해당 환경의 태그 커밋을 revert하는 PR을 머지한다 → ArgoCD가 이전 이미지로 되돌린다. CI는 직전 성공 빌드
이후 `apps/api/` 변경만 보므로 revert를 다시 되돌리지 않는다. 단, 원인 코드를 고치거나 revert하지 않으면
다음 `apps/api/` 커밋이 문제 코드를 다시 배포한다. DB 마이그레이션은 되돌려지지 않는다 — 스키마 변경이
포함된 배포를 롤백할 때는 이전 코드가 새 스키마에서 동작하는지 먼저 확인한다.

워크로드 파드는 Karpenter 노드에 둔다(`nodeSelector karpenter.sh/nodepool: default`). 네임스페이스는 기본 거부라
새 워크로드는 자기 NetworkPolicy가 있어야 통신할 수 있다.

## Jenkins

    kubectl --context lunote port-forward svc/jenkins -n jenkins 8081:8080
    # http://localhost:8081, 계정 admin (비밀번호: Secrets Manager lunote/shared/jenkins의 admin-password)

UI는 외부에 열지 않는다. 인터넷에 열린 것은 웹훅 수신 경로 하나(`https://ci-hooks.lunoteapp.com/github-webhook/`)이고
`platform/namespaces/jenkins-webhook.yaml`이 정의한다 — ALB 규칙이 호스트·정확한 경로·GitHub 발신 IP가 모두 맞는
요청만 전달하고, Jenkins가 HMAC-SHA256 서명(`lunote/shared/jenkins`의 `webhook-secret`)을 검증한다.

- 빌드가 시작되지 않으면: 저장소 Settings → Webhooks → Recent Deliveries. **404** = GitHub 발신 대역이 바뀜
  (`curl -s https://api.github.com/meta | jq .hooks`와 Ingress 주석 비교), **400/403** = 시크릿 불일치,
  **503** = Jenkins가 내려가 있음(재운 동안의 push — 깨운 뒤 Redeliver 또는 Build Now).
- 웹훅 시크릿 교체: Secrets Manager 값 변경 → ExternalSecret 동기화 → Jenkins 재시작 → GitHub 훅의 secret 수정.

설정(플러그인·자격 증명·잡)은 `platform/jenkins/values.yaml`의 JCasC가 기준이다. UI에서 바꾼 설정은
재시작 때 사라진다. 컨트롤러는 코어 노드에, 빌드 Pod는 Karpenter 노드에 뜬다. 빌드 기록은 PVC(gp3 8Gi,
한 AZ에 묶임)에 있다 — 그래서 코어 노드그룹을 같은 AZ(ap-northeast-2c)에 고정했다(`infra/terraform/envs/prod/eks.tf`).

이미지는 다이제스트(@sha256)로 고정돼 있다 — 버전을 올릴 때 `ci/api-build-pod.yaml`의 다이제스트도 함께 바꾼다.

## ArgoCD 접속 (외부 노출 없음)

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

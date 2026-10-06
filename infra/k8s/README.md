# infra/k8s — ArgoCD GitOps 소스

이 디렉터리가 클러스터 내부 상태의 단일 기준이다. `develop`에 머지되면 ArgoCD가 반영한다
(단, `workloads/api/`는 CI가 배포 저장소로 옮긴 뒤에 반영된다 — 아래 "배포").
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
| api-staging | 배포 저장소 `So1ky/lunote-deploy`의 workloads/api/overlays/staging (프로젝트 `staging-api`) | — |
| jenkins | jenkins/jenkins + platform/jenkins/values.yaml | 5.9.65 |

## 변경 방법

values·매니페스트·차트 버전(`apps/*.yaml`의 `targetRevision`)을 고쳐 PR → develop 머지. `helm upgrade`를
직접 실행하지 않는다(ArgoCD selfHeal이 되돌린다). 자동 prune은 꺼져 있다 — 리소스를 지우려면 git에서
제거한 뒤 ArgoCD UI에서 해당 리소스를 수동 삭제한다.

## 배포 (staging은 자동)

`apps/api/`가 바뀐 커밋이 develop에 들어가면 GitHub 웹훅이 Jenkins를 깨워 lint → test → e2e → 이미지 빌드 →
Trivy 스캔 → ECR push를 하고, **배포 저장소 `So1ky/lunote-deploy`(브랜치 `staging`)**에 커밋한다: 그 커밋의
`infra/k8s/workloads/api/`를 통째로 복사하고 `overlays/staging/kustomization.yaml`의 `newTag`만 바꾼 것
(`chore(deploy): staging API 이미지 <SHA> (소스 <SHA>)`, 작성자 lunote-ci). ArgoCD의 api-staging 앱은 그 저장소를 보고
ExternalSecret → 마이그레이션 Job → Deployment 순으로 동기화한다. 마이그레이션이 실패하면 롤아웃하지 않는다.

- CI의 deploy key는 배포 저장소에만 등록돼 있다. 이 저장소에는 쓸 수 없다.
- 이 저장소의 `newTag`는 자리표시다. 실제 배포 버전은 배포 저장소의 최신 커밋에 있다.
- `infra/k8s/workloads/api/`만 바뀐 커밋은 이미지를 다시 만들지 않고 매니페스트만 배포 저장소로 옮긴다.
- 오버레이에 새 종류의 리소스를 추가하면 `apps/project-staging-api.yaml`의 허용 목록에도 넣어야 동기화된다.
- staging 네임스페이스는 Pod Security `restricted`다 — 이를 어기는 Pod 설정은 생성이 거부된다.
- staging API의 Service와 Ingress는 `platform/namespaces/staging-api-{service,ingress}.yaml`에 있다. 네임스페이스
  밖에 영향을 줄 수 있는 종류라 배포 저장소에 두지 않고 프로젝트 허용 목록에서도 뺐다.
- staging의 Redis는 네임스페이스 안의 Pod다(`platform/namespaces/staging-redis.yaml`, 비영속·인증 없음, api Pod만 접속).
  ElastiCache는 prod 전용이고 staging은 그 시크릿을 읽을 수 없다.
- staging·prod의 Pod는 `nodeSelector karpenter.sh/nodepool: default`가 없으면 생성이 거부된다. `nodeName` 직접 지정,
  다른 환경의 PriorityClass, Service `externalIPs`(전 네임스페이스)도 거부된다 — `platform/namespaces/admission-policies.yaml`.
- 정책이 잘못돼 Pod 생성이 막히면: `namespaces` 앱은 prune이 꺼져 있어 git에서 파일을 지워도 클러스터의 정책은 남는다 —
  표현식을 고쳐 커밋하거나(selfHeal 반영), 긴급 시 `kubectl delete validatingadmissionpolicybinding <이름>`으로 바인딩만 지운다(ArgoCD 관리 원칙의 예외).

파이프라인은 저장소 루트 `Jenkinsfile`, 빌드 Pod는 `ci/api-build-pod.yaml`. 한 번 빌드한 산출물을 스캔하고 그대로
올리며, 어느 단계든 실패하면 ECR에 그 SHA 태그가 붙지 않는다. `apps/api/`와 `infra/k8s/workloads/api/` 밖만 바뀐 커밋은 "변경 확인" 단계에서 끝난다.

### prod 승격 (Phase 5-1에서 overlay 추가 후)

staging에서 확인한 SHA를 `workloads/api/overlays/prod/kustomization.yaml`의 `newTag`에 넣는 PR을 만들고
사람이 머지한다. CI는 prod 태그를 건드리지 않는다. 승격할 SHA는 staging의 현재 값을 그대로 쓴다
(같은 이미지를 다시 빌드하지 않는다).

### 롤백

staging: 배포 저장소의 최신 커밋을 revert해 직접 push한다 → ArgoCD가 이전 이미지와 매니페스트로 되돌린다.

```bash
git clone -b staging git@github.com:So1ky/lunote-deploy.git && cd lunote-deploy
git revert --no-edit HEAD && git push origin staging
```

CI는 직전 성공 빌드 이후의 변경만 보므로 revert를 다시 되돌리지 않는다. 그 뒤 매니페스트만 바뀐 커밋이 들어오면
이미지 태그는 롤백한 값을 유지하지만 매니페스트는 develop의 것으로 다시 덮인다. 단, 원인 코드를 고치거나 revert하지 않으면
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
- ALB(Ingress)가 필요한 네임스페이스는 `platform/aws-load-balancer-controller/values.yaml`의
  `ingressClassParams.spec.namespaceSelector`에 추가해야 한다.

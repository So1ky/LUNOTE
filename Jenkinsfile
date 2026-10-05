// LUNOTE API CI — develop의 apps/api 변경을 검증·빌드해 staging 이미지 태그를 갱신한다.
// 배포는 하지 않는다: 마지막 단계가 overlays/staging의 newTag를 커밋하면 ArgoCD가 반영한다.
// 잡 정의는 infra/k8s/platform/jenkins/values.yaml, 빌드 Pod는 ci/api-build-pod.yaml.
//
// Pod를 셋으로 나눈다: 변경 확인(최소) → 빌드(npm·Dockerfile 등 외부 코드가 돈다) → 태그 커밋(최소).
// deploy key는 develop에 쓸 수 있어 ArgoCD를 거쳐 클러스터를 바꿀 수 있는 권한이다.
// 그래서 외부 코드가 도는 빌드 Pod에는 절대 내려보내지 않는다.

// 서드파티 코드가 돌지 않는 최소 Pod — 변경 확인과 태그 커밋에 쓴다.
// AWS 권한(IRSA)도 K8s 토큰도 없고, 빌드 Pod와 작업 폴더를 공유하지 않는다.
def MINIMAL_POD = '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    app.kubernetes.io/component: jenkins-agent
spec:
  automountServiceAccountToken: false
  nodeSelector:
    karpenter.sh/nodepool: default
  containers:
    - name: jnlp
      image: jenkins/inbound-agent:3391.va_37fa_a_305d6d-4-jdk21@sha256:c5d50ca09a7de45999983c69e0527499ca667efe00a85cf1ce5ed968b5b21719
      resources:
        requests:
          cpu: 100m
          memory: 256Mi
        limits:
          memory: 512Mi
'''

pipeline {
  agent none

  options {
    disableConcurrentBuilds() // 태그 커밋 순서 보장
    skipDefaultCheckout()
    timeout(time: 45, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  triggers {
    githubPush() // GitHub 웹훅(push) — 수신 경로와 서명 검증은 infra/k8s/platform/ 참고
  }

  parameters {
    booleanParam(name: 'FORCE_BUILD', defaultValue: false,
      description: 'apps/api 변경이 없어도 빌드한다 (파이프라인 자체를 고쳤을 때)')
  }

  environment {
    AWS_REGION   = 'ap-northeast-2'
    ECR_REGISTRY = '695019457880.dkr.ecr.ap-northeast-2.amazonaws.com'
    ECR_REPO     = 'lunote/api'
    OVERLAY      = 'infra/k8s/workloads/api/overlays/staging/kustomization.yaml'
  }

  stages {
    // 작은 Pod로 "빌드할 필요가 있는가"만 본다. 태그 커밋·문서 커밋은 여기서 끝난다.
    stage('변경 확인') {
      agent {
        kubernetes {
          yaml MINIMAL_POD
        }
      }
      steps {
        script {
          def scmVars = checkout scm
          env.SOURCE_BRANCH = scmVars.GIT_BRANCH
          env.COMMIT = scmVars.GIT_COMMIT
          env.TAG = scmVars.GIT_COMMIT.substring(0, 12)
          // 직전 성공 빌드 이후 apps/api가 바뀌었는가. 기준 커밋이 없거나 사라졌으면 빌드한다.
          def base = scmVars.GIT_PREVIOUS_SUCCESSFUL_COMMIT ?: ''
          def unchanged = base && sh(returnStatus: true,
            script: "git cat-file -e ${base}^{commit} && git diff --quiet ${base} HEAD -- apps/api") == 0
          env.SHOULD_BUILD = (params.FORCE_BUILD || !unchanged) ? 'true' : 'false'
          echo "브랜치 ${env.SOURCE_BRANCH}, 커밋 ${env.TAG}, 기준 ${base ?: '없음'} → 빌드 ${env.SHOULD_BUILD}"
        }
      }
    }

    stage('빌드') {
      when {
        beforeAgent true
        environment name: 'SHOULD_BUILD', value: 'true'
      }
      agent {
        kubernetes {
          yamlFile 'ci/api-build-pod.yaml'
          defaultContainer 'node'
        }
      }
      stages {
        stage('체크아웃') {
          steps {
            container('jnlp') {
              // 확인 단계가 본 바로 그 커밋만 받는다. `checkout scm`을 다시 쓰지 않는 이유: 그 사이 들어온
              // 새 커밋을 git 플러그인이 "빌드한 커밋"으로 기록해 다음 빌드의 변경 판단 기준이 어긋난다.
              sh '''
                set -eu
                git init -q .
                git remote add origin https://github.com/So1ky/LUNOTE.git
                git fetch -q --depth 1 origin "$COMMIT"
                git checkout -q --detach FETCH_HEAD
                test "$(git rev-parse HEAD)" = "$COMMIT"
              '''
            }
          }
        }

        stage('의존성') {
          steps {
            dir('apps/api') {
              sh 'npm ci'
              sh 'npx prisma generate'
            }
          }
        }

        stage('lint') {
          steps {
            dir('apps/api') {
              // package.json의 lint는 --fix가 붙어 있어 CI에서는 검사만 한다
              sh 'npx eslint "{src,apps,libs,test}/**/*.ts"'
            }
          }
        }

        stage('단위 테스트') {
          steps {
            dir('apps/api') {
              sh 'npm test'
            }
          }
        }

        stage('e2e') {
          steps {
            dir('apps/api') {
              sh '''
                for port in 5432 6379 9090 1025 8025; do
                  n=0
                  until nc -z localhost "$port"; do
                    n=$((n + 1))
                    [ "$n" -lt 120 ] || { echo "사이드카 포트 $port 대기 시간 초과"; exit 1; }
                    sleep 1
                  done
                done
                npx prisma migrate deploy
                # 스위트마다 앱 기동 + argon2 가입을 하므로 병렬·기본 5초 제한에서는 컨테이너에서 타임아웃이 난다 (2026-10-05 실측)
                npx jest --config ./test/jest-e2e.json --runInBand --testTimeout=30000
              '''
            }
          }
        }

        stage('npm audit') {
          steps {
            dir('apps/api') {
              // 경고만 — 차단 게이트는 Trivy
              catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                sh 'npm audit --omit=dev --audit-level=high'
              }
            }
          }
        }

        stage('이미지 확인') {
          steps {
            container('aws') {
              script {
                // 태그 불변 저장소라 같은 SHA를 다시 올릴 수 없다 — 이미 있으면 빌드·스캔·push를 건너뛴다.
                // "없음"으로 판정하는 것은 ImageNotFoundException뿐이다. 권한·스로틀링 오류는 여기서 실패시킨다.
                env.IMAGE_EXISTS = sh(returnStdout: true, script: '''
                  if out=$(aws ecr describe-images --repository-name "$ECR_REPO" --image-ids imageTag="$TAG" 2>&1); then
                    echo true
                  elif echo "$out" | grep -q ImageNotFoundException; then
                    echo false
                  else
                    echo "$out" >&2
                    exit 1
                  fi
                ''').trim()
                echo "ECR에 ${env.TAG} 존재: ${env.IMAGE_EXISTS}"
              }
            }
          }
        }

        stage('이미지 빌드') {
          when { environment name: 'IMAGE_EXISTS', value: 'false' }
          steps {
            container('buildkit') {
              script {
                // OCI 레이아웃으로 한 번만 빌드한다. 이 산출물을 스캔하고 그대로 올린다(다시 빌드하지 않는다).
                // /image-out은 buildkit·trivy·crane만 보는 볼륨이다 — npm·테스트가 돈 컨테이너는 산출물을 건드릴 수 없다.
                sh '''
                  buildctl build --frontend dockerfile.v0 \
                    --local context=apps/api --local dockerfile=apps/api \
                    --output type=oci,dest=/image-out/image,tar=false
                '''
                // 스캔 전에 매니페스트 다이제스트를 확정해 둔다 — push는 이 다이제스트를 지정해서만 한다
                env.IMAGE_DIGEST = sh(returnStdout: true, script: '''
                  set -eu
                  digests=$(grep -o '"digest":"sha256:[a-f0-9]\\{64\\}"' /image-out/image/index.json | cut -d'"' -f4)
                  [ "$(echo "$digests" | grep -c .)" -eq 1 ] || { echo "index.json의 매니페스트가 1개가 아니다" >&2; exit 1; }
                  echo "$digests"
                ''').trim()
                echo "빌드한 이미지 다이제스트: ${env.IMAGE_DIGEST}"
              }
            }
          }
        }

        stage('Trivy 스캔') {
          when { environment name: 'IMAGE_EXISTS', value: 'false' }
          steps {
            container('trivy') {
              sh '''
                # 캐시는 공유 작업 폴더 밖에 둔다 — 앞 단계의 외부 코드가 스캔 DB를 미리 심을 수 없게
                trivy image --input /image-out/image --scanners vuln \
                  --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 \
                  --no-progress --cache-dir /tmp/.trivy-cache
              '''
            }
          }
        }

        stage('ECR push') {
          when { environment name: 'IMAGE_EXISTS', value: 'false' }
          steps {
            container('aws') {
              sh '''
                set +x
                AUTH=$(printf 'AWS:%s' "$(aws ecr get-login-password)" | base64 | tr -d '\\n')
                printf '{"auths":{"%s":{"auth":"%s"}}}' "$ECR_REGISTRY" "$AUTH" > /docker-config/config.json
              '''
            }
            // crane 이미지는 /bin/sh가 없다(busybox는 /busybox)
            container(name: 'crane', shell: '/busybox/sh') {
              // 스캔한 산출물을 변환 없이, 빌드 때 기록한 다이제스트를 지정해 올린다. 내용이 그 다이제스트와 다르면
              // 레지스트리가 거부한다(DIGEST_INVALID). 태그는 그 다이제스트에만 붙이므로, 스캔한 것과 다른 이미지가
              // 태그를 얻는 경로가 없다. 태그 없이 남은 이미지는 ECR 수명 주기 정책이 하루 뒤 지운다.
              sh '''
                set -eu
                crane push /image-out/image "$ECR_REGISTRY/$ECR_REPO@$IMAGE_DIGEST"
                crane tag "$ECR_REGISTRY/$ECR_REPO@$IMAGE_DIGEST" "$TAG"
              '''
            }
          }
        }
      }
    }

    // deploy key를 쓰는 유일한 단계 — 외부 코드가 돈 빌드 Pod가 아니라 새 최소 Pod에서 실행한다.
    stage('staging 태그 커밋') {
      when {
        beforeAgent true
        environment name: 'SHOULD_BUILD', value: 'true'
      }
      agent {
        kubernetes {
          yaml MINIMAL_POD
        }
      }
      steps {
        withCredentials([sshUserPrivateKey(credentialsId: 'github-deploy-key', keyFileVariable: 'DEPLOY_KEY')]) {
          retry(3) {
            sh '''
              set -eu
              # GitHub SSH 호스트 키 (https://api.github.com/meta 의 ssh_keys) — 처음 보는 키를 믿지 않는다
              echo "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl" > "$WORKSPACE/known_hosts"
              export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$WORKSPACE/known_hosts"
              rm -rf "$WORKSPACE/deploy"
              git clone -q --depth 1 --branch develop git@github.com:So1ky/LUNOTE.git "$WORKSPACE/deploy"
              cd "$WORKSPACE/deploy"

              current() { sed -n -E 's/^ +newTag: ([^ ]+).*/\\1/p' "$OVERLAY"; }
              if [ "$(current)" = "$TAG" ]; then
                echo "staging은 이미 $TAG"
                exit 0
              fi
              sed -i -E "s|^( +newTag: )[^ ]+|\\1$TAG|" "$OVERLAY"
              # 치환이 안 맞았거나 newTag 줄이 여러 개면 조용히 넘어가지 않고 실패시킨다
              if [ "$(current)" != "$TAG" ]; then
                echo "newTag 치환 실패 — $OVERLAY 형식을 확인할 것"
                exit 1
              fi
              git -c user.name=lunote-ci -c user.email=ci@lunoteapp.com \
                commit -q -am "chore(deploy): staging API 이미지 $TAG"
              if [ "$SOURCE_BRANCH" = "origin/develop" ]; then
                git push -q origin HEAD:develop
                echo "develop에 태그 커밋 push — ArgoCD가 staging에 반영한다"
              else
                git push --dry-run origin HEAD:develop
                echo "develop이 아닌 브랜치($SOURCE_BRANCH) — push는 dry-run만"
              fi
            '''
          }
        }
      }
    }
  }
}

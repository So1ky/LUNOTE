// LUNOTE API CI — develop의 apps/api 변경을 검증·빌드해 staging 이미지 태그를 갱신한다.
// 배포는 하지 않는다: 마지막 단계가 overlays/staging의 newTag를 커밋하면 ArgoCD가 반영한다.
// 잡 정의는 infra/k8s/platform/jenkins/values.yaml, 빌드 Pod는 ci/api-build-pod.yaml.
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
          yaml '''
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
              checkout scm
              // 확인 단계와 같은 커밋으로 고정 (그 사이 develop이 움직였을 수 있다)
              sh 'git checkout -q --detach "$COMMIT"'
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
                  until nc -z localhost "$port"; do sleep 1; done
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
                // 태그 불변 저장소라 같은 SHA를 다시 올릴 수 없다 — 이미 있으면 빌드·스캔·push를 건너뛴다
                env.IMAGE_EXISTS = sh(returnStatus: true, script:
                  'aws ecr describe-images --repository-name "$ECR_REPO" --image-ids imageTag="$TAG" >/dev/null 2>&1'
                ) == 0 ? 'true' : 'false'
                echo "ECR에 ${env.TAG} 존재: ${env.IMAGE_EXISTS}"
              }
            }
          }
        }

        stage('이미지 빌드') {
          when { environment name: 'IMAGE_EXISTS', value: 'false' }
          steps {
            container('buildkit') {
              sh '''
                buildctl build --frontend dockerfile.v0 \
                  --local context=apps/api --local dockerfile=apps/api \
                  --output type=docker,name="$ECR_REGISTRY/$ECR_REPO:$TAG",dest="$WORKSPACE/image.tar"
              '''
            }
          }
        }

        stage('Trivy 스캔') {
          when { environment name: 'IMAGE_EXISTS', value: 'false' }
          steps {
            container('trivy') {
              sh '''
                trivy image --input "$WORKSPACE/image.tar" --scanners vuln \
                  --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 \
                  --no-progress --cache-dir "$WORKSPACE/.trivy-cache"
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
            container('buildkit') {
              // 같은 데몬의 캐시를 쓰므로 다시 빌드하지 않고 올리기만 한다
              sh '''
                buildctl build --frontend dockerfile.v0 \
                  --local context=apps/api --local dockerfile=apps/api \
                  --output type=image,name="$ECR_REGISTRY/$ECR_REPO:$TAG",push=true
              '''
            }
          }
        }

        stage('staging 태그 커밋') {
          steps {
            container('jnlp') {
              withCredentials([sshUserPrivateKey(credentialsId: 'github-deploy-key', keyFileVariable: 'DEPLOY_KEY')]) {
                retry(3) {
                  sh '''
                    set -eu
                    export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$WORKSPACE/ci/github_known_hosts"
                    rm -rf "$WORKSPACE/deploy"
                    git clone -q --depth 1 --branch develop git@github.com:So1ky/LUNOTE.git "$WORKSPACE/deploy"
                    cd "$WORKSPACE/deploy"
                    sed -i -E "s|(newTag: )[0-9a-f]+|\\1$TAG|" "$OVERLAY"
                    if git diff --quiet; then
                      echo "staging은 이미 $TAG"
                      exit 0
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
    }
  }
}

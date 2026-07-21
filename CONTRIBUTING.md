# 기여 가이드

1인 개발 프로젝트지만, 실무 기준의 저장소 규율을 유지한다.

## 브랜치 전략

`README.md`의 브랜치 전략을 따른다. 요약:

- `main` — 프로덕션. **직접 push 금지.** `develop`에서 PR로만 병합. ArgoCD가 이 브랜치를 배포한다.
- `develop` — 통합 브랜치. feature/fix 브랜치의 PR 대상.
- `feature/<이슈번호>-<설명>` / `fix/<설명>` — 작업 단위 브랜치. 병합 후 삭제한다.

## 커밋 컨벤션 — Conventional Commits

```
<type>(<scope>): <제목>          # 제목은 한국어 OK, 명령형
```

| type | 용도 |
|---|---|
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서만 변경 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 의존성, 설정 |
| `infra` | Terraform/K8s/CI 변경 |

scope는 `api`, `mobile`, `terraform`, `k8s` 등 디렉토리 기준.
예: `feat(api): PortOne 웹훅 멱등성 처리 추가`, `infra(terraform): RDS 모듈 작성`

## PR 규칙

- PR은 하나의 목적만 담는다. 500라인 넘으면 쪼갤 수 없는지 먼저 고민한다.
- PR 본문은 템플릿을 채운다. "확인 방법"은 미래의 내가 재검증할 수 있게 쓴다.
- 이슈를 먼저 만들고 브랜치명과 PR에 이슈번호를 연결한다 (`Closes #N`).
- CI(테스트/린트)가 초록불이어야 병합한다.

## 절대 규칙

- 시크릿(.env, 키, 토큰, 인증서)은 어떤 브랜치에도 커밋하지 않는다.
- DB 스키마 변경은 반드시 Prisma 마이그레이션 파일과 함께 커밋한다.
- 아키텍처에 영향 있는 변경은 `docs/ARCHITECTURE.md`를 같은 PR에서 갱신한다.

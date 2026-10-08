# 부하 테스트 (k6)

prod 부하 테스트(체크리스트 5-4, 2026-10 Plan 9)에 쓴 스크립트. k6는 설치하지 않고 다이제스트를 고정한 Docker 이미지로 돌린다.

## 프로필

| PROFILE | 부하 | 용도 |
|---|---|---|
| `smoke` | 초당 1회, 1분 | 스크립트·계정 확인. 전역 한도(분당 100) 아래라 상향 없이 돌릴 수 있다 |
| `baseline` | 초당 20회, 10분 | 합격 판정: 클라이언트 P95 < 500ms, 에러율 < 1% |
| `stress` | 초당 20→40→80→160→320 계단(각 1분 상승·3분 유지) | 한계·첫 병목 탐색. 에러율 ≥ 5% 또는 P95 ≥ 3s가 1분 넘게 이어지면 스스로 멈춘다 |

`baseline`·`stress`는 **한 IP에서** 걸기 때문에 전역 rate limit(`THROTTLE_DEFAULT_LIMIT`, 기본 IP당 분당 100)을
테스트 창 동안만 prod 오버레이에서 올려야 한다(올리는 PR → 테스트 → 되돌리는 PR, 같은 세션 안에).

## 실행

테스트 계정은 prod의 일반 사용자(이메일 인증 완료)이고 비밀번호는 macOS 키체인 서비스 `lunote-loadtest`에만 있다.

```bash
K6_IMAGE='grafana/k6:2.3.0@sha256:9c2dee7f8ed74d317e4027c06a10f169b625638189de8d4555d0b3486a5aeb34'
OUT=<결과 저장 디렉터리>                          # 결과 JSON은 커밋하지 않는다
LT_EMAIL=$(security find-generic-password -s lunote-loadtest | sed -n 's/.*"acct"<blob>="\(.*\)"/\1/p') \
LT_PASSWORD=$(security find-generic-password -s lunote-loadtest -w) \
docker run --rm -e LT_EMAIL -e LT_PASSWORD -e PROFILE=smoke -e WRITE_QUOTES=0 \
  -v "$PWD/loadtest/k6:/scripts:ro" -v "$OUT:/out" \
  "$K6_IMAGE" run --summary-export=/out/smoke.json /scripts/api.js
```

- `-e LT_PASSWORD`처럼 이름만 넘기면 값이 명령줄·프로세스 목록에 남지 않는다.
- `WRITE_QUOTES=1`이면 견적 생성(전체의 2%)이 섞인다. 견적 1건마다 **관리자 전원에게 메일**이 가므로 prod 관리자가 0명일 때만 쓴다.
- 판정은 k6 요약(클라이언트 P95, ALB·인터넷 왕복 포함)과 Prometheus의 서버 P95(`http_server_request_duration_bucket{job="api",namespace="prod"}`)를 같이 본다.

## 끝나면

테스트 계정·문의·알림 행은 prod DB에서 지운다(바스천 psql, 트랜잭션). SQL은 2026-10 Plan 9 Task 7.

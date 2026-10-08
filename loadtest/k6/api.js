// LUNOTE API 부하 테스트 (체크리스트 5-4, Plan 9). 실행 방법은 loadtest/README.md.
// 비밀번호는 환경 변수로만 받는다 — 요청 본문을 출력하는 옵션(--http-debug=full)을 쓰지 말 것.
import http from 'k6/http';
import { check, fail } from 'k6';

const BASE = __ENV.BASE_URL || 'https://api.lunoteapp.com';
const PROFILE = __ENV.PROFILE || 'smoke';
// 견적 생성은 관리자 메일을 만든다 — prod 관리자 0명일 때만 1 (Plan 9 Task 2)
const WRITE_QUOTES = __ENV.WRITE_QUOTES === '1';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

// 도착률 실행기: "초당 반복 수"를 고정한다 — 서버가 느려져도 부하가 줄지 않는다
const PROFILES = {
  smoke: {
    executor: 'constant-arrival-rate',
    rate: 1,
    timeUnit: '1s',
    duration: '1m',
    preAllocatedVUs: 5,
    maxVUs: 10,
  },
  baseline: {
    executor: 'constant-arrival-rate',
    rate: 20,
    timeUnit: '1s',
    duration: '10m',
    preAllocatedVUs: 40,
    maxVUs: 200,
  },
  // 계단: 1분 올리고 3분 유지 — HPA(15초 주기)·Karpenter(노드 ≈30~60초)·Pod 기동이 반응할 시간
  stress: {
    executor: 'ramping-arrival-rate',
    startRate: 20,
    timeUnit: '1s',
    preAllocatedVUs: 100,
    maxVUs: 1000,
    stages: [
      { target: 20, duration: '2m' },
      { target: 40, duration: '1m' },
      { target: 40, duration: '3m' },
      { target: 80, duration: '1m' },
      { target: 80, duration: '3m' },
      { target: 160, duration: '1m' },
      { target: 160, duration: '3m' },
      { target: 320, duration: '1m' },
      { target: 320, duration: '3m' },
    ],
  },
};

const THRESHOLDS = {
  smoke: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  // 합격 기준(결정 3): 클라이언트 P95 < 500ms, 에러율 < 1%
  baseline: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  // 중단 조건(결정 8): 한계를 찾되 공유 RDS를 오래 포화시키지 않는다
  stress: {
    http_req_failed: [
      { threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '1m' },
    ],
    http_req_duration: [
      { threshold: 'p(95)<3000', abortOnFail: true, delayAbortEval: '1m' },
    ],
  },
};

if (!PROFILES[PROFILE]) fail(`알 수 없는 PROFILE: ${PROFILE}`);

export const options = {
  scenarios: { [PROFILE]: PROFILES[PROFILE] },
  thresholds: THRESHOLDS[PROFILE],
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  // setup 로그인은 판정에서 뺀다
  setupTimeout: '30s',
};

function authed(token, name) {
  return {
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
    tags: { name },
  };
}

// 본 부하 전에 한 번: 로그인(인증 스로틀 5/분이라 1회만) + 상세 조회용 문의 ID 수집
export function setup() {
  const email = __ENV.LT_EMAIL;
  const password = __ENV.LT_PASSWORD;
  if (!email || !password) fail('LT_EMAIL·LT_PASSWORD 환경 변수가 필요하다');

  const login = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS, tags: { name: 'setup' } },
  );
  if (login.status !== 200) fail(`setup 로그인 실패: HTTP ${login.status}`);
  const token = login.json('accessToken');

  const list = http.get(`${BASE}/quote-requests`, authed(token, 'setup'));
  if (list.status !== 200) fail(`setup 목록 조회 실패: HTTP ${list.status}`);
  const ids = list.json().map((r) => r.id);
  return { token, ids };
}

// 가중치 = 앱 화면 사용 비율 추정. 합 100. 상세 조회는 문의가 있을 때만, 견적 생성은 WRITE_QUOTES일 때만 —
// 빠진 비중은 목록 조회로 넘긴다(총 요청률은 그대로)
function buildMix(hasIds) {
  const mix = [
    ['GET /quote-requests', 30],
    ['GET /quote-requests/:id', hasIds ? 20 : 0],
    ['GET /notifications', 20],
    ['GET /users/me', 15],
    ['PATCH /users/me', 5],
    ['POST /attachments/presign', 8],
    ['POST /quote-requests', WRITE_QUOTES ? 2 : 0],
  ];
  const missing = 100 - mix.reduce((s, [, w]) => s + w, 0);
  mix[0][1] += missing;
  return mix;
}

function pick(mix) {
  let r = Math.random() * 100;
  for (const [name, weight] of mix) {
    if (r < weight) return name;
    r -= weight;
  }
  return mix[0][0];
}

export default function (data) {
  const name = pick(buildMix(data.ids.length > 0));
  const p = authed(data.token, name);
  let res;
  switch (name) {
    case 'GET /quote-requests':
      res = http.get(`${BASE}/quote-requests`, p);
      break;
    case 'GET /quote-requests/:id': {
      const id = data.ids[Math.floor(Math.random() * data.ids.length)];
      res = http.get(`${BASE}/quote-requests/${id}`, p);
      break;
    }
    case 'GET /notifications':
      res = http.get(`${BASE}/notifications`, p);
      break;
    case 'GET /users/me':
      res = http.get(`${BASE}/users/me`, p);
      break;
    case 'PATCH /users/me':
      res = http.patch(`${BASE}/users/me`, JSON.stringify({ language: 'en' }), p);
      break;
    case 'POST /attachments/presign':
      // 서명만 받는다 — S3에는 아무것도 올리지 않는다
      res = http.post(
        `${BASE}/attachments/presign`,
        JSON.stringify({ fileName: 'loadtest.jpg', mimeType: 'image/jpeg', sizeBytes: 1024 }),
        p,
      );
      break;
    case 'POST /quote-requests':
      res = http.post(
        `${BASE}/quote-requests`,
        JSON.stringify({ category: 'OTHER', description: 'k6 load test request — safe to delete' }),
        p,
      );
      break;
  }
  check(res, { 'status 2xx': (r) => r.status >= 200 && r.status < 300 });
}

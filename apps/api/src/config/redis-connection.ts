/**
 * REDIS_URL → BullMQ(ioredis) 연결 옵션.
 * BullMQ는 URL 문자열이 아니라 옵션 객체를 받는다. 스킴(rediss = TLS), 사용자정보(AUTH),
 * 경로(논리 DB 번호 — 환경 분리: prod /0, staging /1)를 빠짐없이 옮긴다.
 */
export function redisConnectionFromUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // 원본 에러는 input 필드에 URL(비밀번호 포함)을 담고 있어 그대로 던지면 로그에 남는다
    throw new Error('REDIS_URL 형식이 올바르지 않습니다');
  }
  const dbPath = url.pathname.slice(1);
  const db = dbPath === '' ? undefined : Number(dbPath);
  if (db !== undefined && (!Number.isInteger(db) || db < 0)) {
    throw new Error('REDIS_URL의 DB 번호가 올바르지 않습니다');
  }
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    ...(db !== undefined ? { db } : {}),
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}

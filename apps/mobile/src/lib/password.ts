/** 비밀번호 정책 — 서버 auth/password.policy.ts와 동일하게 유지한다 */
export const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,72}$/;

/** 사용자 노출 정책 문구는 i18n(password.policy)에서 온다 */

export const isValidPassword = (password: string) =>
  PASSWORD_PATTERN.test(password);

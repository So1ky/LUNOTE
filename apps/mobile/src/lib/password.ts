/** 비밀번호 정책 — 서버 auth/password.policy.ts와 동일하게 유지한다 */
export const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,72}$/;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be 8+ characters and include a letter, a number, and a special character';

export const isValidPassword = (password: string) =>
  PASSWORD_PATTERN.test(password);

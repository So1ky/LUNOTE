/**
 * 비밀번호 정책 — 8자 이상, 영문자·숫자·특수문자 각 1개 이상, 공백 불가.
 * 가입/재설정/변경 DTO가 모두 이 패턴을 공유한다 (모바일 lib/password.ts와 동일하게 유지).
 */
export const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,72}$/;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be 8+ characters and include a letter, a number, and a special character';

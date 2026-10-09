import { BadRequestException } from '@nestjs/common';
import type { SocialIdentity } from '../../src/auth/social/social-identity';

/**
 * e2e용 가짜 토큰: "fake|<sub>|<email>|<발급 후 경과 초>". 실제 서명 검증은 단위 테스트가 맡는다.
 * 'fake'로 시작하지 않으면 검증 실패(400)를 흉내 낸다.
 */
export const fakeToken = (sub: string, email = '', ageSec = 0) =>
  `fake|${sub}|${email}|${ageSec}`;

export function parseFakeToken(token: string): SocialIdentity {
  const [kind, sub, email, ageSec = '0'] = token.split('|');
  if (kind !== 'fake' || !sub) throw new BadRequestException('Invalid token');
  return {
    providerId: sub,
    email: email || undefined,
    issuedAt: new Date(Date.now() - Number(ageSec) * 1000),
  };
}

export const fakeGoogleVerifier = {
  verify: ({ idToken }: { idToken: string }) =>
    Promise.resolve(parseFakeToken(idToken)),
};

export const fakeAppleVerifier = {
  verify: ({ identityToken }: { identityToken: string }) =>
    Promise.resolve(parseFakeToken(identityToken)),
  // "fake|<type>|<sub>"
  verifyNotification: (payload: string) => {
    const [kind, type, sub] = payload.split('|');
    if (kind !== 'fake') throw new BadRequestException('Invalid notification');
    return Promise.resolve({ type, sub });
  },
};

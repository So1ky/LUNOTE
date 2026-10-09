import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  decodeProtectedHeader,
  exportPKCS8,
  generateKeyPair,
  jwtVerify,
} from 'jose';
import { AppleAuthClient } from './apple-auth.client';

let pem: string;
let publicKey: CryptoKey;

beforeAll(async () => {
  const pair = await generateKeyPair('ES256', { extractable: true });
  pem = await exportPKCS8(pair.privateKey);
  publicKey = pair.publicKey;
});

const client = (overrides: Record<string, string> = {}) => {
  const values: Record<string, string> = {
    APPLE_BUNDLE_ID: 'com.lunoteapp',
    APPLE_TEAM_ID: 'TEAM123',
    APPLE_KEY_ID: 'KEY123',
    APPLE_PRIVATE_KEY: pem,
    ...overrides,
  };
  return new AppleAuthClient({
    get: (k: string) => values[k],
    getOrThrow: (k: string) => values[k],
  } as unknown as ConfigService);
};

const response = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status });

let fetchMock: jest.SpyInstance<
  ReturnType<typeof fetch>,
  Parameters<typeof fetch>
>;
beforeEach(() => {
  fetchMock = jest.spyOn(global, 'fetch');
});
afterEach(() => {
  fetchMock.mockRestore();
});

const sentForm = (call = 0) =>
  new URLSearchParams(
    (fetchMock.mock.calls[call][1]?.body as URLSearchParams).toString(),
  );

describe('AppleAuthClient.exchangeCode', () => {
  it('성공 → refresh token, client_secret은 .p8로 서명한 ES256 JWT', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, { refresh_token: 'apple-refresh' }),
    );
    await expect(client().exchangeCode('code-1')).resolves.toBe(
      'apple-refresh',
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://appleid.apple.com/auth/token',
    );
    const form = sentForm();
    expect(form.get('grant_type')).toBe('authorization_code');
    expect(form.get('code')).toBe('code-1');
    expect(form.get('client_id')).toBe('com.lunoteapp');
    const secret = form.get('client_secret')!;
    expect(decodeProtectedHeader(secret)).toMatchObject({
      alg: 'ES256',
      kid: 'KEY123',
    });
    const { payload } = await jwtVerify(secret, publicKey, {
      issuer: 'TEAM123',
      audience: 'https://appleid.apple.com',
      subject: 'com.lunoteapp',
    });
    expect(payload.exp! - payload.iat!).toBeLessThanOrEqual(300);
  });

  it('APPLE_PRIVATE_KEY가 \\n 이스케이프 한 줄이어도 동작 (.env 형식)', async () => {
    fetchMock.mockResolvedValueOnce(response(200, { refresh_token: 'r' }));
    await expect(
      client({ APPLE_PRIVATE_KEY: pem.replace(/\n/g, '\\n') }).exchangeCode(
        'c',
      ),
    ).resolves.toBe('r');
  });

  it('Apple 400(invalid_grant: 만료·재사용 code) → 400', async () => {
    fetchMock.mockResolvedValueOnce(response(400, { error: 'invalid_grant' }));
    await expect(client().exchangeCode('old')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('Apple 400 invalid_client(서버 설정 오류) → 503', async () => {
    fetchMock.mockResolvedValueOnce(response(400, { error: 'invalid_client' }));
    await expect(client().exchangeCode('c')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('200인데 JSON이 아닌 본문 → 503', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not json', { status: 200 }));
    await expect(client().exchangeCode('c')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('깨진 키 → 503, Apple 호출 안 함', async () => {
    await expect(
      client({ APPLE_PRIVATE_KEY: 'not-a-key' }).exchangeCode('c'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Apple 5xx → 503', async () => {
    fetchMock.mockResolvedValueOnce(response(503));
    await expect(client().exchangeCode('c')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('네트워크 실패 → 503', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(client().exchangeCode('c')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('미설정(로컬) → 503, Apple 호출 안 함', async () => {
    await expect(
      client({ APPLE_PRIVATE_KEY: '' }).exchangeCode('c'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('AppleAuthClient.revoke', () => {
  it('성공 → true, refresh_token 힌트로 호출', async () => {
    fetchMock.mockResolvedValueOnce(response(200));
    await expect(client().revoke('apple-refresh')).resolves.toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://appleid.apple.com/auth/revoke',
    );
    expect(sentForm().get('token')).toBe('apple-refresh');
    expect(sentForm().get('token_type_hint')).toBe('refresh_token');
  });

  it('두 번 실패 후 성공 → true', async () => {
    fetchMock
      .mockResolvedValueOnce(response(500))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(response(200));
    await expect(client().revoke('r')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('3회 모두 실패 → false (던지지 않는다)', async () => {
    fetchMock.mockResolvedValue(response(500));
    await expect(client().revoke('r')).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('깨진 키 → false (던지지 않는다)', async () => {
    await expect(
      client({ APPLE_PRIVATE_KEY: 'not-a-key' }).revoke('r'),
    ).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('미설정 → false (던지지 않는다)', async () => {
    await expect(client({ APPLE_PRIVATE_KEY: '' }).revoke('r')).resolves.toBe(
      false,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

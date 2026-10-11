import { ConfigService } from '@nestjs/config';
import { ExpoPushClient } from './expo-push.client';

const client = (accessToken?: string) =>
  new ExpoPushClient({
    get: (key: string) =>
      key === 'EXPO_PUSH_ACCESS_TOKEN' ? accessToken : undefined,
  } as unknown as ConfigService);

const okResponse = (count: number) =>
  ({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        data: Array.from({ length: count }, (_, i) => ({
          status: 'ok',
          id: `t${i}`,
        })),
      }),
  }) as unknown as Response;

describe('ExpoPushClient', () => {
  let fetchSpy: jest.SpyInstance;
  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });
  afterEach(() => fetchSpy.mockRestore());

  it('exp.host에 JSON 배열로 POST하고 티켓을 순서대로 돌려준다', async () => {
    fetchSpy.mockResolvedValue(okResponse(2));
    const tickets = await client().send([
      {
        to: 'ExponentPushToken[a]',
        title: 'T',
        body: 'B',
        data: { requestId: 1 },
      },
      { to: 'ExponentPushToken[b]', title: 'T', body: 'B' },
    ]);
    expect(tickets).toHaveLength(2);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://exp.host/--/api/v2/push/send');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['content-type']).toBe('application/json');
    expect(headers.authorization).toBeUndefined();
    expect(JSON.parse(init.body as string)).toHaveLength(2);
  });

  it('액세스 토큰이 있으면 Bearer 헤더를 붙인다', async () => {
    fetchSpy.mockResolvedValue(okResponse(1));
    await client('secret-token').send([
      { to: 'ExponentPushToken[a]', title: 'T', body: 'B' },
    ]);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBe(
      'Bearer secret-token',
    );
  });

  it('100개 단위로 청크해 호출한다', async () => {
    fetchSpy
      .mockResolvedValueOnce(okResponse(100))
      .mockResolvedValueOnce(okResponse(1));
    const tickets = await client().send(
      Array.from({ length: 101 }, (_, i) => ({
        to: `ExponentPushToken[${i}]`,
        title: 'T',
        body: 'B',
      })),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(tickets).toHaveLength(101);
  });

  it('HTTP 비정상이면 throw (BullMQ 재시도 대상)', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    });
    await expect(
      client().send([{ to: 'ExponentPushToken[a]', title: 'T', body: 'B' }]),
    ).rejects.toThrow(/503/);
  });

  it('빈 배열이면 호출하지 않는다', async () => {
    expect(await client().send([])).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

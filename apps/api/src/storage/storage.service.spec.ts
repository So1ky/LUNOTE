import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const keys = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => ({ Key: `uploads/u1/${from + i}` }));

describe('StorageService.deletePrefix', () => {
  let service: StorageService;
  let send: jest.SpyInstance;

  beforeEach(() => {
    service = new StorageService(
      new ConfigService({
        S3_BUCKET: 'bucket',
        S3_REGION: 'us-east-1',
        PRESIGN_UPLOAD_TTL_SEC: '300',
        PRESIGN_DOWNLOAD_TTL_SEC: '300',
      }),
    );
    send = jest.spyOn(S3Client.prototype, 'send');
  });

  afterEach(() => send.mockRestore());

  it('목록이 빌 때까지 1000개 단위로 반복 삭제하고 개수를 반환한다', async () => {
    const pages = [keys(1000), keys(5, 1000), []];
    send.mockImplementation((cmd: unknown) => {
      if (cmd instanceof ListObjectsV2Command) {
        return Promise.resolve({ Contents: pages.shift() });
      }
      return Promise.resolve({});
    });

    await expect(service.deletePrefix('uploads/u1/')).resolves.toBe(1005);
    const deletes = (send.mock.calls as unknown[][]).filter(
      ([c]) => c instanceof DeleteObjectsCommand,
    );
    expect(deletes).toHaveLength(2);
    expect(
      (deletes[0]?.[0] as DeleteObjectsCommand | undefined)?.input.Delete
        ?.Objects,
    ).toHaveLength(1000);
    const lists = (send.mock.calls as unknown[][]).filter(
      ([c]) => c instanceof ListObjectsV2Command,
    );
    expect(
      (lists[0]?.[0] as ListObjectsV2Command | undefined)?.input.Prefix,
    ).toBe('uploads/u1/');
  });

  it('S3가 일부 객체 삭제 실패를 돌려주면 throw — 큐가 재시도한다', async () => {
    send.mockImplementation((cmd: unknown) => {
      if (cmd instanceof ListObjectsV2Command) {
        return Promise.resolve({ Contents: keys(2) });
      }
      return Promise.resolve({
        Errors: [{ Key: 'uploads/u1/0', Code: 'AccessDenied' }],
      });
    });

    await expect(service.deletePrefix('uploads/u1/')).rejects.toThrow(
      'AccessDenied',
    );
  });

  it('uploads/<id>/ 형태가 아닌 프리픽스는 거부 — 버킷 전체 삭제 방지', async () => {
    await expect(service.deletePrefix('uploads/')).rejects.toThrow();
    await expect(service.deletePrefix('')).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
});

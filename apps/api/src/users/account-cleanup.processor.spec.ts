import { Job } from 'bullmq';
import { MetricsService } from '../observability/metrics.service';
import { StorageService } from '../storage/storage.service';
import { AccountCleanupProcessor } from './account-cleanup.processor';
import type { AccountCleanupJob } from './account-deletion.service';

const job = (attemptsMade: number) =>
  ({
    data: { userId: 'u1' },
    attemptsMade,
    opts: { attempts: 5 },
  }) as unknown as Job<AccountCleanupJob>;

describe('AccountCleanupProcessor', () => {
  const storage = { deletePrefix: jest.fn() };
  const metrics = { accountCleanupFailure: jest.fn() };
  const processor = new AccountCleanupProcessor(
    storage as unknown as StorageService,
    metrics as unknown as MetricsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('사용자 프리픽스를 삭제한다', async () => {
    storage.deletePrefix.mockResolvedValue(3);
    await processor.process(job(0));
    expect(storage.deletePrefix).toHaveBeenCalledWith('uploads/u1/');
  });

  it('중간 시도 실패는 메트릭 없이 다시 던진다', async () => {
    storage.deletePrefix.mockRejectedValue(new Error('boom'));
    await expect(processor.process(job(1))).rejects.toThrow('boom');
    expect(metrics.accountCleanupFailure).not.toHaveBeenCalled();
  });

  it('마지막 시도 실패는 메트릭을 올리고 다시 던진다', async () => {
    storage.deletePrefix.mockRejectedValue(new Error('boom'));
    await expect(processor.process(job(4))).rejects.toThrow('boom');
    expect(metrics.accountCleanupFailure).toHaveBeenCalledTimes(1);
  });
});

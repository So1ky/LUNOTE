import { Queue } from 'bullmq';
import {
  AUTO_COMPLETE_JOB,
  AUTO_COMPLETE_INTERVAL_MS,
  CompletionProcessor,
} from './completion.processor';
import { QuoteRequestsService } from './quote-requests.service';

describe('CompletionProcessor', () => {
  const queue = { upsertJobScheduler: jest.fn().mockResolvedValue(undefined) };
  const service = { autoCompleteExpired: jest.fn().mockResolvedValue(2) };
  const processor = new CompletionProcessor(
    queue as unknown as Queue,
    service as unknown as QuoteRequestsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('모듈 초기화 때 1시간 주기 스케줄러를 고정 ID로 등록한다 (재기동해도 1개)', async () => {
    await processor.onModuleInit();
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      AUTO_COMPLETE_JOB,
      { every: AUTO_COMPLETE_INTERVAL_MS },
      expect.objectContaining({ name: AUTO_COMPLETE_JOB }),
    );
    expect(AUTO_COMPLETE_INTERVAL_MS).toBe(60 * 60 * 1000);
  });

  it('잡이 돌면 현재 시각으로 기한 지난 문의를 자동 완료한다', async () => {
    await processor.process();
    expect(service.autoCompleteExpired).toHaveBeenCalledTimes(1);
    expect(service.autoCompleteExpired).toHaveBeenCalledWith(expect.any(Date));
  });
});

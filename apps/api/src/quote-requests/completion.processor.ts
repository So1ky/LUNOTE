import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QuoteRequestsService } from './quote-requests.service';

export const COMPLETION_QUEUE = 'completion';
export const AUTO_COMPLETE_JOB = 'auto-complete';
export const AUTO_COMPLETE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * 완료 확인 기한이 지난 문의를 자동 완료하는 주기 잡 (ARCHITECTURE §7 AWAITING_CONFIRMATION).
 * 지연 잡 대신 1시간 스캔인 이유: Redis가 유실돼도(staging 비영속) DB가 원천이라 다음 주기에 복구된다.
 * 스케줄러는 고정 ID로 upsert — 파드가 여럿이어도 1개, 재기동해도 중복되지 않는다.
 */
@Processor(COMPLETION_QUEUE)
export class CompletionProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(CompletionProcessor.name);

  constructor(
    @InjectQueue(COMPLETION_QUEUE) private readonly queue: Queue,
    private readonly quoteRequests: QuoteRequestsService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      AUTO_COMPLETE_JOB,
      { every: AUTO_COMPLETE_INTERVAL_MS },
      {
        name: AUTO_COMPLETE_JOB,
        opts: { removeOnComplete: 10, removeOnFail: 10 },
      },
    );
  }

  async process(): Promise<void> {
    const count = await this.quoteRequests.autoCompleteExpired(new Date());
    if (count > 0) this.logger.log(`확인 기한 경과 자동 완료 ${count}건`);
  }
}

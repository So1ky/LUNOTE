import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Job } from 'bullmq';
import { MetricsService } from '../observability/metrics.service';
import { StorageService } from '../storage/storage.service';
import {
  ACCOUNT_CLEANUP_QUEUE,
  AccountCleanupJob,
} from './account-deletion.service';

/** 탈퇴 사용자의 업로드 파일(아바타·첨부·미첨부 업로드)을 S3에서 영구 삭제한다 */
@Processor(ACCOUNT_CLEANUP_QUEUE)
export class AccountCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(AccountCleanupProcessor.name);

  constructor(
    private readonly storage: StorageService,
    private readonly metrics: MetricsService,
  ) {
    super();
  }

  async process(job: Job<AccountCleanupJob>): Promise<void> {
    const { userId } = job.data;
    try {
      const count = await this.storage.deletePrefix(`uploads/${userId}/`);
      this.logger.log(`탈퇴 사용자 파일 삭제 user=${userId} objects=${count}`);
    } catch (e) {
      // 마지막 시도 실패 = 개인정보 파일이 남는다 → 사람이 잡을 재등록해야 한다
      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        this.metrics.accountCleanupFailure();
        Sentry.captureException(e, { extra: { userId } });
      }
      throw e;
    }
  }
}

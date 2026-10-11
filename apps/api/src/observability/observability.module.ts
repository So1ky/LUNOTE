import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/** 어디서나 주입 — 카운터는 도메인 모듈마다 import하지 않게 전역으로 둔다 */
@Global()
@Module({
  providers: [
    { provide: MetricsService, useFactory: () => new MetricsService() },
  ],
  exports: [MetricsService],
})
export class ObservabilityModule {}

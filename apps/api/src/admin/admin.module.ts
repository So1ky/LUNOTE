import { Module } from '@nestjs/common';
import { AdminQuoteRequestsController } from './admin-quote-requests.controller';
import { AdminQuoteRequestsService } from './admin-quote-requests.service';

@Module({
  controllers: [AdminQuoteRequestsController],
  providers: [AdminQuoteRequestsService],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminQuoteRequestsController } from './admin-quote-requests.controller';
import { AdminQuoteRequestsService } from './admin-quote-requests.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminQuoteRequestsController],
  providers: [AdminQuoteRequestsService],
})
export class AdminModule {}

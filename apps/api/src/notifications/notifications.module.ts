import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import {
  NOTIFICATIONS_QUEUE,
  NotificationsService,
} from './notifications.service';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor, MailService],
  exports: [NotificationsService, MailService],
})
export class NotificationsModule {}

import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PortOneGateway } from './portone.gateway';
import { PortOneWebhookController } from './portone-webhook.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController, PortOneWebhookController],
  providers: [PaymentsService, PortOneGateway],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AdminQuoteRequestsController } from './admin-quote-requests.controller';
import { AdminQuoteRequestsService } from './admin-quote-requests.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [NotificationsModule, UsersModule],
  controllers: [AdminQuoteRequestsController, AdminUsersController],
  providers: [AdminQuoteRequestsService, AdminUsersService],
})
export class AdminModule {}

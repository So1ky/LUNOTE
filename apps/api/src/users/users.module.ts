import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SocialAuthModule } from '../auth/social/social-auth.module';
import { AccountCleanupProcessor } from './account-cleanup.processor';
import {
  ACCOUNT_CLEANUP_QUEUE,
  AccountDeletionService,
} from './account-deletion.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: ACCOUNT_CLEANUP_QUEUE }),
    SocialAuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, AccountDeletionService, AccountCleanupProcessor],
  exports: [UsersService, AccountDeletionService],
})
export class UsersModule {}

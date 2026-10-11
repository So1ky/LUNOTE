import { ApiProperty } from '@nestjs/swagger';
import { PushPlatform } from '@prisma/client';
import { IsEnum, Matches } from 'class-validator';

/** Expo 푸시 토큰 형식만 허용 — 임의 문자열 저장 차단 */
export const EXPO_PUSH_TOKEN_PATTERN = /^ExponentPushToken\[[A-Za-z0-9_-]+\]$/;

export class PutPushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'token must be an Expo push token',
  })
  token: string;

  @ApiProperty({ enum: PushPlatform })
  @IsEnum(PushPlatform)
  platform: PushPlatform;
}

export class DeletePushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'token must be an Expo push token',
  })
  token: string;
}

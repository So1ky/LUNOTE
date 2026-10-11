import { ApiProperty } from '@nestjs/swagger';
import { PushPlatform } from '@prisma/client';
import { IsEnum, Matches, MaxLength } from 'class-validator';

/**
 * Expo 푸시 토큰 형식만 허용 — 임의 문자열 저장 차단.
 * 접두어는 Expo/Exponent 둘 다, 괄호 안은 공백·']'만 아니면 허용(Expo가 내부 형식을 보장하지 않음).
 * 길이는 MaxLength(200)으로 따로 제한한다
 */
export const EXPO_PUSH_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\]\s]+\]$/;

export class PutPushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @MaxLength(200)
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
  @MaxLength(200)
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'token must be an Expo push token',
  })
  token: string;
}

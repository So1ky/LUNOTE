import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** 가입 방식별 재인증 — 계정 provider와 맞는 필드만 사용한다 (UsersService.deleteMe) */
export class DeleteMeDto {
  @ApiPropertyOptional({ description: 'EMAIL 가입자 — 현재 비밀번호' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ApiPropertyOptional({ description: 'GOOGLE 가입자 — 방금 받은 ID 토큰' })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  idToken?: string;

  @ApiPropertyOptional({
    description: 'APPLE 가입자 — 방금 받은 identity token',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  identityToken?: string;

  @ApiPropertyOptional({
    description: 'APPLE 가입자 — 연결 해제(revoke)용 1회용 code',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  authorizationCode?: string;
}

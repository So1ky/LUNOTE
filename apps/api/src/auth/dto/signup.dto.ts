import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  // 최소 8자 — 상세 정책(대소문자/특수문자)은 UX 해치지 않는 선에서 추후 조정
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}

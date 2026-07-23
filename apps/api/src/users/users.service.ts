import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateMeDto } from './dto/update-me.dto';

/** 프로필 응답 공통 SELECT — /auth/me와 PATCH /users/me가 같은 모양을 반환한다 */
const PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  emailVerifiedAt: true,
  language: true,
  avatarS3Key: true,
  quoteEmailEnabled: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    return this.withAvatarUrl(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    // 아바타 키는 본인 업로드 프리픽스만 허용 — 타인 파일 참조(IDOR) 차단
    if (dto.avatarS3Key && !dto.avatarS3Key.startsWith(`uploads/${userId}/`)) {
      throw new ForbiddenException('avatarS3Key does not belong to you');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName?.trim() || undefined,
        lastName: dto.lastName?.trim() || undefined,
        language: dto.language,
        avatarS3Key: dto.avatarS3Key,
        quoteEmailEnabled: dto.quoteEmailEnabled,
      },
      select: PROFILE_SELECT,
    });
    return this.withAvatarUrl(user);
  }

  private async withAvatarUrl<T extends { avatarS3Key: string | null }>(
    user: T,
  ) {
    const { avatarS3Key, ...rest } = user;
    return {
      ...rest,
      avatarUrl: avatarS3Key
        ? await this.storage.presignDownload(avatarS3Key)
        : null,
    };
  }
}

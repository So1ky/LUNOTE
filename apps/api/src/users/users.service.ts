import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { verify as argonVerify } from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AccountDeletionService } from './account-deletion.service';
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
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly accountDeletion: AccountDeletionService,
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
      },
      select: PROFILE_SELECT,
    });
    return this.withAvatarUrl(user);
  }

  /** 본인 탈퇴 — 비밀번호 재확인 후 익명화 (탈취된 액세스 토큰만으로는 되돌릴 수 없는 삭제를 못 하게) */
  async deleteMe(userId: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    // 소셜 가입자 재인증은 소셜 로그인 작업에서 추가 — 그전까지는 지원 경로(관리자 대행)로
    if (!user.passwordHash) {
      throw new ForbiddenException(
        'This account has no password — contact support to delete it',
      );
    }
    // 401이 아닌 400 — 앱 클라이언트는 401을 세션 만료로 보고 로그아웃시킨다
    if (!(await argonVerify(user.passwordHash, password))) {
      throw new BadRequestException('Password is incorrect');
    }
    await this.accountDeletion.deleteAccount(userId);
    return { deleted: true };
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

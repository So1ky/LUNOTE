import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountDeletionService } from '../users/account-deletion.service';

/** 앱 없이 들어온 삭제 요청(이메일)을 관리자가 대행 처리 — Google Play 사용자 데이터 정책 */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountDeletion: AccountDeletionService,
  ) {}

  /** 요청 메일의 발신 주소로 대상 id를 찾는다 — 식별에 필요한 최소 필드만 반환 */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(userId: string, adminId: string) {
    await this.accountDeletion.deleteAccount(userId, adminId);
    return { deleted: true };
  }
}

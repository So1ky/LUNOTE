import { UserRole } from '@prisma/client';

/** JwtStrategy.validate가 반환해 request.user에 담기는 사용자 정보 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  emailVerifiedAt: Date | null;
}

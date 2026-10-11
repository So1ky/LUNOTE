import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** 컨트롤러/핸들러에 허용 role을 지정한다. JwtAuthGuard 뒤에 RolesGuard와 함께 사용. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

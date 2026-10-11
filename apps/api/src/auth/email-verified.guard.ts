import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthUser } from './auth-user';

/**
 * 이메일 인증을 마친 사용자만 통과시킨다. JwtAuthGuard 뒤에 사용.
 * 403 + EMAIL_NOT_VERIFIED 코드 — 앱은 이 코드를 보고 인증 화면으로 보낸다.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user?.emailVerifiedAt) {
      throw new ForbiddenException({
        message: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }
    return true;
  }
}

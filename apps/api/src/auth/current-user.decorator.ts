import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** JwtStrategy.validate가 반환한 사용자 객체를 꺼내는 데코레이터 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
    return request.user;
  },
);

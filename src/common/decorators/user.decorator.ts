import { ExecutionContext, createParamDecorator } from "@nestjs/common";

// 요청 데이터 파싱 decorator
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
)
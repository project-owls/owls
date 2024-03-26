import { SetMetadata } from "@nestjs/common";

// 응답 시 message 설정 decorator
export const ResponseMsg = (message: string) => SetMetadata('response-message', message);
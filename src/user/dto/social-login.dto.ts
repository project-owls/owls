import { PickType } from "@nestjs/swagger";
import { UserDto } from "src/common/dto/user.dto";

export class SocialLoginDto extends PickType(UserDto, ['email', 'nickname'] as const) {
}
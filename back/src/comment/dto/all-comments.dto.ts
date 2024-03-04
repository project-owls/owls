import { PartialType } from "@nestjs/swagger";
import { CommentDto } from "src/common/dto/comment.dto";

export class AllCommentsDto {
  comments: Partial<CommentDto>[]
}

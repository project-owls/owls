import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CommentDto } from "src/common/dto/comment.dto";

export class AllCommentsDto {
  @ApiProperty({
    example: [{
      "id": 1,
      "content": "내용",
      "likeCount": 5,
      "createdAt": "2024-03-03T14:43:11.128Z",
      "user": {
        "nickname": "하마"
      },
      "comment": {
        "id": 2,
        "content": "대댓글",
        "likeCount": 3,
        "createdAt": "2024-03-03T15:51:34.1458Z",
        "user": {
          "nickname": "코끼리"
        },
      },
    },  {"id": 2,}],
    description: '게시글 내용',
    required: true
  })
  comments: Partial<CommentDto>[]
}

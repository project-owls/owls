import { ApiProperty } from "@nestjs/swagger";

export class CreateCommentDto {
  @ApiProperty({
    example: "1",
    description: '댓글id',
  })
  id: number;

  @ApiProperty({
    example: "댓글입니다.",
    description: '내용',
    required: true,
  })
  content: string;

  @ApiProperty({
    example: "2024-02-19T13:56:13.248Z",
    description: '생성일',
    required: true,
  })
  createdAt: Date;
  userId: string;
  boardId: number;

  @ApiProperty({
    example: 1,
    description: '부모댓글'
  })
  parentComment?: number;
}

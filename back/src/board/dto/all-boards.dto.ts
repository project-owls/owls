import { ApiProperty } from "@nestjs/swagger";
import { BoardDto } from "src/common/dto/board.dto";


export class AllBoardsDto {
  @ApiProperty({
    example: '개발-전체',
    description: '게시판 카테고리',
    required: true
  })
  category?: string;

  @ApiProperty({
    example: [{
      "id": 1,
      "title": "제목",
      "content": "내용",
      "published": true,
      "views": 100,
      "likeCount": 5,
      "createdAt": "2024-03-03T14:43:11.128Z",
      "updatedAt": "2024-03-03T14:43:29.843Z",
      "user": {
        "nickname": "하마"
      },
      "boardCategory": {
        "name": "개발-질문"
      },
      "FileUpload": [{
        "url": "/uploads/320418329-341.png"
      },]
    },  {"id": 2,}],
    description: '게시글 내용',
    required: true
  })
  boards: Partial<BoardDto>[];

  @ApiProperty({
    example: '123',
    description: '해당 카테고리 총 게시글 수',
    required: true
  })
  boardTotalCount?: number;

  @ApiProperty({
    example: '22',
    description: '해당 카테고리 총 페이지',
    required: true
  })
  boardTotalPage?: number;
}
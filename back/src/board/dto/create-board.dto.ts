import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsString } from "class-validator";

export class CreateBoardDto {
  @ApiProperty({
    example: '59',
    description: '게시판 id',
    required: true
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    example: '야자팟 활용 꿀팁',
    description: '제목',
    required: true
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: '혼자 안해서 든든하고 좋습니다.',
    description: '내용',
    required: true
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: 'false',
    description: '공개 여부',
  })
  @IsBoolean()
  published: boolean;

  @ApiProperty({
    example: '2024-02-19T13:56:13.248Z',
    description: '생성일',
  })
  createAt: Date;

  @ApiProperty({
    example: '2024-02-19T13:56:13.248Z',
    description: '수정일',
  })
  updateAt: Date;

  @ApiProperty({
    example: '1',
    description: '카테고리 id',
    required: true
  })
  categoryId: number;

  userId: string;
}
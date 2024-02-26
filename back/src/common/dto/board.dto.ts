import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDate, IsNumber, IsString } from "class-validator";


export class BoardDto {
  @ApiProperty({
    example: '12',
    description: '게시글 id',
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    example: '야자팟 최고',
    description: '게시글 제목',
    required: true
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: '야간에 혼자 작업하기 쓸쓸했는데 같이하는 친구들이 생기니 의욕 뿜뿜!',
    description: '게시글 내용',
    required: true
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: 'false',
    description: '게시글 공개 여부(true: 공개, false: 비공개)',
  })
  @IsBoolean()
  published: boolean;

  @ApiProperty({
    example: '100',
    description: '게시글 좋아요 수',
  })
  @IsNumber()
  likeCount: number;

  @ApiProperty({
    example: '592024-02-19 13:56:13.248',
    description: '생성일',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    example: '592024-02-19 13:56:13.248',
    description: '수정일',
  })
  @IsDate()
  updatedAt: Date;

  userId: string;
  
  categoryId: number;
  
  boardCategory?: {
    id?: number;
    name?: string;
  };
  user?: {
    id?: string;
    nickname?: string;
  };
}
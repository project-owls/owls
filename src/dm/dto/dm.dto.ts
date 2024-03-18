import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";

export class DMDto {
  @ApiProperty({
    example: '50',
    description: 'DM id',
    required: true
  })
  @IsNumber()
  id?: number;

  @ApiProperty({
    example: 'DM 내용입니다.',
    description: 'DM 내용',
    required: true
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: '2024-02-19T13:56:13.248Z',
    description: '생성일',
  })
  @IsDate()
  createdAt?: Date;

  @ApiProperty({
    example: '830e71e3-e324-4c4a-b1dd-9c6763f43523d',
    description: '처음 DM 보낸 유저 id',
    required: true
  })
  @IsString()
  senderId?: string;

  @ApiProperty({
    example: 'ff79feaa-0431-4775-8258-f5093b123eqw1',
    description: '처음 DM 받은 유저 id',
    required: true
  })
  @IsString()
  receiverId?: string;

  @ApiProperty({
    example: '233',
    description: 'DM 방 id',
    required: true
  })
  @IsString()
  DMRoomId?: number;

  @ApiProperty({
    example: {
      id: '830e71e3-e324-4c4a-b1dd-9c6763f43523d',
      nickname: '하마',
      profileImage: {
        url: 'uploads/default.png'
      }
    },
    description: '처음 DM 보낸 유저 정보',
    required: true
  })
  sendUser?: {
    id?: string;
    nickname?: string;
    profileImage?: {
      url?: string;
    }
  }

  @ApiProperty({
    example: {
      id: 'ff79feaa-0431-4775-8258-f5093b123eqw1',
      nickname: '코끼리',
      profileImage: {
        url: 'uploads/default.png'
      }
    },
    description: '처음 DM 받은 유저 정보',
    required: true
  })
  receiveUser?: {
    id?: string;
    nickname?: string;
    profileImage?: {
      url?: string;
    }
  }
}

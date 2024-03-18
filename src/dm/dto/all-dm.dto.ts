import { IsString } from "class-validator";
import { DMDto } from "./dm.dto"
import { ApiProperty } from "@nestjs/swagger";

export class AllDMDto {
  @ApiProperty({
    example: '50',
    description: 'DMRoom id',
    required: true
  })
  @IsString()
  DMRoomId: number;

  @ApiProperty({
    example: {
      DM: [{
        content: 'DM 내용입니다.',
        createdAt: '2024-02-19T13:56:13.248Z',
        sendUser: {
          id: '830e71e3-e324-4c4a-b1dd-9c6763f43523d',
          nickname: '하마',
          profileImage: {
            url: 'uploads/default.png'
          }
        },
        receiveUser: {
          id: 'ff79feaa-0431-4775-8258-f5093b123eqw1',
          nickname: '코끼리',
          profileImage: {
            url: 'uploads/default.png'
          }
        }
      }]
    },
    description: 'DM 내용',
    required: true
  })
  DMRoom: {
    DM: Partial<DMDto>[]
  }
}
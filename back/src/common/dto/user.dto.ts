import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsEmail, IsString, MaxLength } from "class-validator";

export class UserDto {
  @ApiProperty({
    example: '15f2bb42-4812-41a6-bf01-541266f51f7a',
    description: '유저 id',
    required: true
  })
  id: string;

  @ApiProperty({
    example: 'test@gmail.com',
    description: '이메일',
    required: true
  })
  @IsEmail(
    {},
    {
      message: '이메일 양식에 맞게 입력해 주세요.'
    }
  )
  email: string;

  @ApiProperty({
    example: '발가락양말',
    description: '닉네임',
    required: true
  })
  @IsString()
  @MaxLength(20, {
    message: '닉네임은 최대 $constraint1자 입니다.'
  })
  nickname: string;

  @ApiProperty({
    example: '2024-02-19 13:56:13.248',
    description: '생성일'
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-19 13:56:13.248',
    description: '생성일'
  })
  @IsDate()
  updatedAt: Date;
}
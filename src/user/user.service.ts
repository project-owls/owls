import { BadRequestException, Injectable } from '@nestjs/common';
import { user, userProfileImage } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserDto } from '../common/dto/user.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
  ) {}

  // 회원가입
  async userCreate(socialLoginDto: SocialLoginDto): Promise<user> {
    return await this.prisma.user.create({
      data: socialLoginDto,
    });
  }

  // id를 통한 유저 정보 조회
  async findById(id: string): Promise<user | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        profileImage: {
          select: {
            url: true,
          }
        }
      }
    })
  }

  // email을 통한 유저 정보 조회
  async findByEmail(email: string): Promise<user | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      }
    })
  }

  // nickname을 통한 유저 정보 조회
  async findByNickname(nickname: string): Promise<user | null> {
    return this.prisma.user.findUnique({
      where: {
        nickname,
      }
    })
  }

  // 유저 정보 업데이트
  async userUpdate(id: string, updateUserData: UserDto): Promise<user> {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserData
    })
  }

  // 회원탈퇴
  async userDelete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id,
      }
    })
  }

  // 유저 프로필이미지 생성
  async createUserProfileImage(userId: string, url: string) {
    return await this.prisma.userProfileImage.create({
      data: {
        userId,
        url
      }
    })
  }

  // 유저 프로필 이미지 업데이트
  // 
  async updateUserProfileImage(userId: string, file: Express.Multer.File): Promise<userProfileImage> {
    if (!file) {
      throw new BadRequestException('파일을 첨부해주세요')
    }

    // 기존 프로필 이미지 확인
    const findUserProfileImageUrl = (await this.findUserProfileImage(userId)).url

    // s3 접속관련 설정
    const awsRegion = process.env.AWS_REGION
    const bucketName = process.env.BUCKET_NAME

    const client = new S3Client({
      region: awsRegion,
      credentials: {
        accessKeyId: process.env.AWS_ACCESSKEY,
        secretAccessKey: process.env.AWS_SECRETKEY,
      },
    })

    // 파일명 중복 방지를 위한 문자열을 파일명 앞에 생성
    const key = `${Date.now().toString()}-${file.originalname}`

    // s3에 이미지 저장을 위한 정보
    const command = new PutObjectCommand({
      Key: key,
      Body: file.buffer,
      Bucket: bucketName,
    });

    // s3에 파일 업로드
    const UploadFileS3 = await client.send(command);

    // 파일 업로드 실패시 error throw
    if (UploadFileS3.$metadata.httpStatusCode !== 200) {
      throw new BadRequestException('파일 업로드에 실패했습니다.')
    }

    // 저장 후 db 저장을 위한 url
    const url = `https://owls24.s3.ap-northeast-2.amazonaws.com/${key}`

    //신규 프로필 이미지로 업데이트
    const updateUserProfileImage = await this.prisma.userProfileImage.update({
      where: {
        userId,
      },
      data: {
        url
      }
    })

    // 기존 프로필 이미지가 default 이미지가 아니라면 삭제
    if (findUserProfileImageUrl !== "https://owls24.s3.ap-northeast-2.amazonaws.com/default.png") {
      // s3에서 삭제 코드
      const deleteProfileImage = new DeleteObjectCommand({
        Key: findUserProfileImageUrl.substring(47),
        Bucket: bucketName
      })

      await client.send(deleteProfileImage)
    }

    return updateUserProfileImage
  }

  // 유저 프로필 이미지 조회
  async findUserProfileImage(userId: string): Promise<userProfileImage> {
    return await this.prisma.userProfileImage.findUnique({
      where: {
        userId,
      }
    })
  }
}
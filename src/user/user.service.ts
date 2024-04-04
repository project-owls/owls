import { Injectable } from '@nestjs/common';
import { user, userProfileImage } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserDto } from '../common/dto/user.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import fs from 'fs';

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
  async updateUserProfileImage(userId: string, url: string): Promise<userProfileImage> {
    // 기존 프로필 이미지 확인
    const findUserProfileImageUrl = (await this.findUserProfileImage(userId)).url
    
    // 기존 프로필 이미지가 서버에 있고 default 이미지가 아니라면 삭제
    if (fs.existsSync(findUserProfileImageUrl) && findUserProfileImageUrl !== "uploads/default.png") {
      fs.unlinkSync(findUserProfileImageUrl)
    }

    // 신규 프로필 이미지로 업데이트
    const updateUserProfileImage = await this.prisma.userProfileImage.update({
      where: {
        userId,
      },
      data: {
        url
      }
    })

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
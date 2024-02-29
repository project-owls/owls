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

  async create(socialLoginDto: SocialLoginDto): Promise<user> {
    return await this.prisma.user.create({
      data: socialLoginDto,
    });
  }

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

  async findByEmail(email: string): Promise<user | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      }
    })
  }

  async findByNickname(nickname: string): Promise<user | null> {
    return this.prisma.user.findUnique({
      where: {
        nickname,
      }
    })
  }

  async update(id: string, updateUserData: UserDto): Promise<user> {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserData
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id,
      }
    })
  }

  async createUserProfileImage(userId: string, url: string) {
    return await this.prisma.userProfileImage.create({
      data: {
        userId,
        url
      }
    })
  }

  async updateUserProfileImage(userId: string, url: string): Promise<userProfileImage> {
    const findUserProfileImageUrl = (await this.findUserProfileImage(userId)).url
    
    if (fs.existsSync(findUserProfileImageUrl) && findUserProfileImageUrl !== "uploads\\default.png") {
      fs.unlinkSync(findUserProfileImageUrl)
    }

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

  async findUserProfileImage(userId: string): Promise<userProfileImage> {
    return await this.prisma.userProfileImage.findUnique({
      where: {
        userId,
      }
    })
  }
}
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserDto } from '../common/dto/user.dto';
import { SocialLoginDto } from './dto/socialLogin.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(socialLoginDto: SocialLoginDto): Promise<User> {
    return await this.prisma.user.create({
      data: socialLoginDto,
    });
  }

  async findById(id: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        id,
      }
    })
  }

  async findByEmail(email: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        email,
      }
    })
  }

  async findByNickname(nickname: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        nickname,
      }
    })
  }

  async update(id: string, updateUserData: UserDto): Promise<User> {
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
}

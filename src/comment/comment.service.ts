import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma.service';
import { AllCommentsDto } from './dto/all-comments.dto';
import { CommentDto } from 'src/common/dto/comment.dto';
import { commentLike } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor (
    private prisma: PrismaService
  ) {}

  async createComment(createCommentDto: CreateCommentDto): Promise<CreateCommentDto | null> {
    return await this.prisma.comment.create({
      data: createCommentDto
    })
  }

  async getSpecificBoardComments(boardId: number): Promise<AllCommentsDto | null> {
    const getSpecificBoardComments = await this.prisma.comment.findMany({
      where: {
        boardId,
        parentComment: null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        user: {
          select: {
            nickname: true
          }
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            likeCount: true,
            user: {
              select: {
                nickname: true,
                profileImage: {
                  select: {
                    url: true,
                  }
                }
              }
            },
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return {
      comments: getSpecificBoardComments
    }
  }

  async updateComment(commentId: number, updateCommentDto: UpdateCommentDto): Promise<CommentDto | null> {
    return await this.prisma.comment.update({
      where: {
        id: commentId
      },
      data: updateCommentDto
    })
  }

  async getComment(commentId: number): Promise<CommentDto | null> {
    return await this.prisma.comment.findUnique({
      where: {
        id: commentId
      }
    })
  }

  async deleteComment(commentId: number): Promise<void> {
    await this.prisma.comment.delete({
      where: {
        id: commentId
      }
    })
  }

  async searchCommentLike(commentId: number, userId: string): Promise<commentLike | null> {
    return await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          commentId,
          userId,
        }
      }
    })
  }

  async createCommentLike(commentId: number, userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.commentLike.create({
        data: {
          commentId,
          userId,
        }
      }),
      this.prisma.comment.update({
        where: {
          id: commentId,
        },
        data: {
          likeCount: {
            increment: 1
          }
        }
      })
    ])
  }

  async deleteCommentLike(commentId: number, userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.commentLike.delete({
        where: {
          userId_commentId: {
            commentId,
            userId,
          }
        }
      }),
      this.prisma.comment.update({
        where: {
          id: commentId,
        },
        data: {
          likeCount: {
            decrement: 1
          }
        }
      })
    ])

  }
}

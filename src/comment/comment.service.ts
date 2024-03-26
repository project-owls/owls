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

  // 댓글 작성
  async createComment(createCommentDto: CreateCommentDto): Promise<CreateCommentDto | null> {
    return await this.prisma.comment.create({
      data: createCommentDto
    })
  }

  // 특정 게시글 댓글 조회
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

  // 댓글 업데이트
  async updateComment(commentId: number, updateCommentDto: UpdateCommentDto): Promise<CommentDto | null> {
    return await this.prisma.comment.update({
      where: {
        id: commentId
      },
      data: updateCommentDto
    })
  }

  // 특정 댓글 조회
  async getComment(commentId: number): Promise<CommentDto | null> {
    return await this.prisma.comment.findUnique({
      where: {
        id: commentId
      }
    })
  }

  // 댓글 삭제
  async deleteComment(commentId: number): Promise<void> {
    await this.prisma.comment.delete({
      where: {
        id: commentId
      }
    })
  }

  // 댓글 좋아요 조회
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

  // 댓글 좋아요 누르기
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

  // 댓글 좋아요 취소
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

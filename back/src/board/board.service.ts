import { Injectable } from '@nestjs/common';
import { board } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
  ) {}
  
  async createBoard(createBoardDto: CreateBoardDto): Promise<board> {
    return await this.prisma.board.create({
      data: createBoardDto,
    })
  }

  async getAllBoards(perPage: number, page: number) {
    const allBoards = await this.prisma.$transaction([
      this.prisma.board.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          likeCount: true,
          createdAt: true,
          updatedAt: true,
          boardCategory: {
            select: {
              name: true
            }
          },
          user: {
            select: {
              nickname: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.board.count({})
    ])

    return { allBoards: allBoards[0], boardTotalCount: allBoards[1], boardTotalPage: Math.ceil(allBoards[1] / perPage) }
  }

  async getSpecificCategoryBoards(perPage: number, page: number, categoryId: number) {
    const CategoryBoards = await this.prisma.$transaction([
      this.prisma.board.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        where: {
          categoryId,
        },
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          likeCount: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              nickname: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.board.count({
        where: {
          categoryId,
        }
      }),
      this.prisma.boardCategory.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          name: true,
        }
      })
    ])

    return { category: CategoryBoards[2].name, allBoards: CategoryBoards[0], boardTotalCount: CategoryBoards[1], boardTotalPage: Math.ceil(CategoryBoards[1] / perPage) }
  }

  async getSpecificBoard(boardId: number) {
    return await this.prisma.board.findUnique({
      where: {
        id: boardId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        likeCount: true,
        createdAt: true,
        updatedAt: true,
        boardCategory: {
          select: {
            name: true,
          }
        },
        user: {
          select: {
            nickname: true,
          }
        }
      }
    })
  }

  async getBoardCreateUserId(boardId: number): Promise<board> {
    return await this.prisma.board.findUnique({
      where: {
        id: boardId
      }
    })
  }

  async updateBoard(boardId: number, updateBoardDto: UpdateBoardDto): Promise<board> {
    return this.prisma.board.update({
      where: {
        id: boardId,
      },
      data: updateBoardDto,
    })
  }

  async deleteBoard(boardId: number): Promise<void> {
    await this.prisma.board.delete({
      where: {
        id: boardId,
      }
    })
  }
}

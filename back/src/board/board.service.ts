import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardDto } from 'src/common/dto/board.dto';
import { AllBoardsDto } from './dto/all-boards.dto';
import { boardLike } from '@prisma/client';

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
  ) {}
  
  async createBoard(createBoardDto: CreateBoardDto): Promise<BoardDto> {
    return await this.prisma.board.create({
      data: createBoardDto,
    })
  }

  async getAllBoards(perPage: number, page: number): Promise<AllBoardsDto> {
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

  async getSpecificCategoryBoards(perPage: number, page: number, categoryId: number): Promise<AllBoardsDto> {
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

  async getSpecificBoard(boardId: number): Promise<Partial<BoardDto>> {
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

  async getBoardCreateUserId(boardId: number): Promise<BoardDto> {
    return await this.prisma.board.findUnique({
      where: {
        id: boardId
      }
    })
  }

  async updateBoard(boardId: number, updateBoardDto: UpdateBoardDto): Promise<BoardDto> {
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

  async searchLike(boardId: number, userId: string): Promise<boardLike> {
    return await this.prisma.boardLike.findUnique({
      where: {
        userId_boardId: {
          boardId,
          userId,
        }
      }
    })
  }

  async createLike(boardId: number, userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.boardLike.create({
        data: {
          boardId,
          userId,
        }
      }),
      this.prisma.board.update({
        where: {
          id: boardId,
        },
        data: {
          likeCount: {
            increment: 1
          }
        }
      })
    ])
  }

  async deleteLike(boardId: number, userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.boardLike.delete({
        where: {
          userId_boardId: {
            boardId,
            userId
          }
        }
      }),
      this.prisma.board.update({
        where: {
          id: boardId,
        },
        data: {
          likeCount: {
            decrement: 1
          }
        }
      })
    ])
  }

  async getSpecificCategoryPopularBoardsSinceAWeekAgo(categoryId: number): Promise<Partial<BoardDto>[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7).toString().slice(0, 10);
      
    return await this.prisma.board.findMany({
      where: {
        categoryId,
        createdAt: {
          gte: oneWeekAgo,
        },
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
      },
      orderBy: {
        likeCount: 'desc',
      },
      take: 3
    })
  }
}

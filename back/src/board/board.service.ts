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

  async getBoardCategoryParent(categoryId: number) {
    return await this.prisma.boardCategory.findMany({
      where: {
        parentCategory: categoryId
      },
      select: {
        id: true,
      }
    })
  }

  async getSpecificCategoryBoards(page: number, categoryId: number, sort: string) {
    let whereField: { [key: string]: number | { [key: string]: number } };
    let orderByField: { [key: string]: 'desc' | 'asc'}

    const getBoardCategoryParent = await this.getBoardCategoryParent(categoryId);

    if (getBoardCategoryParent.length === 0) {
      whereField = { categoryId }
    } else {
      whereField = { boardCategory: { parentCategory: categoryId } }
    }

    if (sort === "views") {
      orderByField = { views: 'desc' }
    } else {
      orderByField = { createdAt: 'desc' }
    }
    
    const getSpecificCategoryBoards = await this.prisma.board.findMany({
      skip: (page - 1) * 10,
      take: 10,
      where: whereField,
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        views: true,
        likeCount: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            nickname: true,
          }
        },
        boardCategory: {
          select: {
            name: true,
          }
        }
      },
      orderBy: orderByField,
    })

    const getCategoryName = await this.prisma.boardCategory.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        name: true,
      }
    })

    const boardTotalCount = await this.prisma.board.count({
      where: whereField,
    })

    return { category: getCategoryName?.name, boards: getSpecificCategoryBoards, boardTotalCount, boardTotalPage: Math.ceil(boardTotalCount / 10) }
  }

  async getSpecificBoard(boardId: number): Promise<Partial<BoardDto> | null> {
    return await this.prisma.board.findUnique({
      where: {
        id: boardId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        views: true,
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

  async getBoardCreateUserId(boardId: number): Promise<BoardDto | null> {
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

  async searchLike(boardId: number, userId: string): Promise<boardLike | null> {
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

  async getSpecificCategoryPopularBoardsSinceAWeekAgo(categoryId: number): Promise<AllBoardsDto> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7).toString().slice(0, 10);
    
    let whereField: { [key: string]: number | { [key: string]: number | Date } };

    const getBoardCategoryParent = await this.getBoardCategoryParent(categoryId);

    if (getBoardCategoryParent.length === 0) {
      whereField = { categoryId, createdAt: { gte: oneWeekAgo } }
    } else {
      whereField = { boardCategory: { parentCategory: categoryId }, createdAt: { gte: oneWeekAgo } }
    }

    const getSpecificCategoryPopularBoardsSinceAWeekAgo = await this.prisma.board.findMany({
      where: whereField,
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        views: true,
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
      orderBy: [
        {
          views: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: 3
    })

    return { boards: getSpecificCategoryPopularBoardsSinceAWeekAgo }
  }

  async increseBoardviews(boardId: number) {
    return await this.prisma.board.update({
      where: {
        id: boardId,
      },
      data: {
        views: {
          increment: 1
        }
      }
    })
  }
}

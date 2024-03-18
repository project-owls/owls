import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardDto } from 'src/common/dto/board.dto';
import { AllBoardsDto } from './dto/all-boards.dto';
import { boardLike } from '@prisma/client';
import fs from 'fs';

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
  ) {}
  
  async createBoard(createBoardDto: CreateBoardDto, files: Express.Multer.File[]): Promise<Partial<BoardDto> | null> {

    const createBoard = await this.prisma.board.create({
      data: createBoardDto,
    })

    if (files.length !== 0) {
      await this.createBoardUploadsFile(createBoard.id, files)
    }

    return await this.getSpecificBoard(createBoard.id)
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

  async getSpecificCategoryBoards(page: number, categoryId: number, sort: string): Promise<Partial<AllBoardsDto> | null> {
    let whereField;
    let orderByField;

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
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true
              }
            },
          }
        },
        boardCategory: {
          select: {
            name: true,
          }
        },
        FileUpload: {
          select: {
            url: true,
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
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true
              }
            },
          }
        },
        FileUpload: {
          select: {
            url: true,
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

  async updateBoard(boardId: number, updateBoardDto: UpdateBoardDto, files: Express.Multer.File[]): Promise<Partial<BoardDto> | null> {
    await this.deleteBoardUploadsFile(boardId)
    await this.createBoardUploadsFile(boardId, files)

    return await this.prisma.board.update({
      where: {
        id: boardId,
      },
      data: updateBoardDto,
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
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true
              }
            },
          }
        },
        FileUpload: {
          select: {
            url: true,
          }
        }
      }
    })
  }

  async deleteBoard(boardId: number): Promise<void> {
    await this.prisma.board.delete({
      where: {
        id: boardId,
      }
    })
  }

  async searchBoardLike(boardId: number, userId: string): Promise<boardLike | null> {
    return await this.prisma.boardLike.findUnique({
      where: {
        userId_boardId: {
          boardId,
          userId,
        }
      }
    })
  }

  async createBoardLike(boardId: number, userId: string): Promise<void> {
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

  async deleteBoardLike(boardId: number, userId: string): Promise<void> {
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
    
    let whereField;

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
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true
              }
            },
          }
        },
        FileUpload: {
          select: {
            url: true,
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

  async searchBoards(categoryId: number, search: string, page: number, sort: string): Promise<AllBoardsDto | null> {
      const searchList = search.split(' ');
    
      const modifiedSearch = searchList.map((search) => {
        return `*${search}*`;
      });

      console.log(modifiedSearch)
      const fullTextQuery = modifiedSearch.join(' ');

    let whereField;
    let orderByField;

    const getBoardCategoryParent = await this.getBoardCategoryParent(categoryId);

    if (getBoardCategoryParent.length === 0) {
      whereField = { categoryId, title: { search: fullTextQuery }, content: { search: fullTextQuery } }
    } else {
      whereField =  { boardCategory: { parentCategory: categoryId }, title: { search: fullTextQuery }, content: { search: fullTextQuery } }
    }

    if (sort === "views") {
      orderByField = { views: 'desc' }
    } else {
      orderByField = { _relevance: { fields: ['title', 'content'], search: fullTextQuery, sort: 'desc' } }
    }

    const searchBoards = await this.prisma.board.findMany({
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
        boardCategory: {
          select: {
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: {
              select: {
                url: true
              }
            },
          }
        },
        FileUpload: {
          select: {
            url: true,
          }
        }
      },
      orderBy: orderByField
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

    return { category: getCategoryName?.name, boards: searchBoards, boardTotalCount, boardTotalPage: Math.ceil(boardTotalCount / 10) }
  }

  async createBoardUploadsFile (boardId: number, files: Express.Multer.File[]): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      await this.prisma.boardFileUpload.create({
        data: {
          boardId,
          url: files[i].path
        }
      })
    }
  }

  async deleteBoardUploadsFile (boardId: number): Promise<void> {
    const findBoardUploadsFile = await this.prisma.boardFileUpload.findMany({
      where: {
        boardId,
      }
    })

    for (let i = 0; i < findBoardUploadsFile.length; i++) {

      if (fs.existsSync(findBoardUploadsFile[i].url)) {
        fs.unlinkSync(findBoardUploadsFile[i].url)
      }
    }

    await this.prisma.boardFileUpload.deleteMany({
      where: {
        boardId
      }
    })
  }
}



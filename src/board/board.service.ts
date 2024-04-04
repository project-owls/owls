import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardDto } from 'src/common/dto/board.dto';
import { AllBoardsDto } from './dto/all-boards.dto';
import { boardLike } from '@prisma/client';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
  ) {}
  
  // 게시글 생성
  async createBoard(createBoardDto: CreateBoardDto, files: Express.Multer.File[]): Promise<Partial<BoardDto> | null> {

    const createBoard = await this.prisma.board.create({
      data: createBoardDto,
    })

    // 업로드 파일이 있을 경우 db에 파일 저장
    if (files.length !== 0) {
      await this.createBoardUploadsFile(createBoard.id, files)
    }

    return await this.getSpecificBoard(createBoard.id)
  }

  // 게시판 카테고리 부모 조회
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

    // 전체 조회인지 특정 카테고리(예: 질문, 스터디, 기타) 조회인지 확인
    if (getBoardCategoryParent.length === 0) {
      whereField = { categoryId }
    } else {
      whereField = { boardCategory: { parentCategory: categoryId } }
    }

    // 조회순(views), 최신순(default)
    if (sort === "views") {
      orderByField = { views: 'desc' }
    } else {
      orderByField = { createdAt: 'desc' }
    }
    
    // 해당 카테고리 게시글 검색
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

    // 카테고리 이름 조회
    const getCategoryName = await this.prisma.boardCategory.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        name: true,
      }
    })

    // 해당 카테고리 게시글 수 조회
    const boardTotalCount = await this.prisma.board.count({
      where: whereField,
    })

    // 카테고리 이름, 게시글, 게시글 수, 총 페이지 수(한 페이지당 게시글 10개 기준) 응답
    return { category: getCategoryName?.name, boards: getSpecificCategoryBoards, boardTotalCount, boardTotalPage: Math.ceil(boardTotalCount / 10) }
  }

  // 특정 게시글 1개 조회
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

  // 특정 게시글 생성 유저 조회
  async getBoardCreateUserId(boardId: number): Promise<BoardDto | null> {
    return await this.prisma.board.findUnique({
      where: {
        id: boardId
      }
    })
  }

  // 게시글 업데이트
  async updateBoard(boardId: number, updateBoardDto: UpdateBoardDto, files: Express.Multer.File[]): Promise<Partial<BoardDto> | null> {
    // 기존 등록된 파일 모두 삭제
    await this.deleteBoardUploadsFile(boardId)
    // 새로 업데이트된 파일 등록
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

  // 게시글 삭제
  async deleteBoard(boardId: number): Promise<void> {
    // 게시글 파일 삭제
    await this.deleteBoardUploadsFile(boardId)

    await this.prisma.board.delete({
      where: {
        id: boardId,
      }
    })
  }

  // 기존에 좋아요를 눌렀는지 확인
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

  // 좋아요 누르기
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

  // 좋아요 취소
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

  // 특정 카테고리 게시판 인기글 조회(일주일 기준, 조회순)
  async getSpecificCategoryPopularBoardsSinceAWeekAgo(categoryId: number): Promise<AllBoardsDto> {
    // 현재 시간 기준 일주일 전 조회
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7).toString().slice(0, 10);
    
    let whereField;

    const getBoardCategoryParent = await this.getBoardCategoryParent(categoryId);

    // 전체인지 특정 카테고리(질문, 스터디 등)인지 확인 후 where 절 설정
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

  // 게시글 조회 수 추가
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

  // 게시글 검색
  async searchBoards(categoryId: number, search: string, page: number, sort: string): Promise<AllBoardsDto | null> {
      // 검색어 띄어쓰기 기준 split
      const searchList = search.split(' ');
    
      // 검색을 위해 앞뒤로 *를 붙임(붙임으로써 검색기능 향상)
      const modifiedSearch = searchList.map((search) => {
        return `*${search}*`;
      });

      // 위의 처리를 끝낸뒤 다시 하나로 join
      const fullTextQuery = modifiedSearch.join(' ');

    let whereField;
    let orderByField;

    const getBoardCategoryParent = await this.getBoardCategoryParent(categoryId);

    // 전체인지 특정 카테고리(질문, 스터디 등)인지 확인 후 where 절 설정
    if (getBoardCategoryParent.length === 0) {
      whereField = { categoryId, title: { search: fullTextQuery }, content: { search: fullTextQuery } }
    } else {
      whereField =  { boardCategory: { parentCategory: categoryId }, title: { search: fullTextQuery }, content: { search: fullTextQuery } }
    }

    // 조회순(views), 정확도 순(default)
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

  // 게시글 파일 업로드
  async createBoardUploadsFile (boardId: number, files: Express.Multer.File[]): Promise<void> {
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
    for (let i = 0; i < files.length; i++) {
      // 파일명 중복 방지를 위한 문자열을 파일명 앞에 생성
      const key = `${Date.now().toString()}-${files[i].originalname}`

      // s3에 이미지 저장을 위한 정보
      const command = new PutObjectCommand({
        Key: key,
        Body: files[i].buffer,
        Bucket: bucketName,
      });

      // s3에 파일 업로드
      const UploadFileS3 = await client.send(command);

      if (UploadFileS3.$metadata.httpStatusCode !== 200) {
        throw new BadRequestException('파일 업로드에 실패했습니다.')
      }

      // 저장 후 db 저장을 위한 url
      const url = `https://owls24.s3.ap-northeast-2.amazonaws.com/${key}`
      
      await this.prisma.boardFileUpload.create({
        data: {
          boardId,
          url,
        }
      })
    }
  }

  // 게시글 파일 삭제
  async deleteBoardUploadsFile (boardId: number): Promise<void> {
    const findBoardUploadsFile = await this.prisma.boardFileUpload.findMany({
      where: {
        boardId,
      },
      select: {
        url: true,
      }
    })

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

    for (let i = 0; i < findBoardUploadsFile.length; i++) {
        const deleteProfileImage = new DeleteObjectCommand({
          Key: findBoardUploadsFile[i].url.substring(47),
          Bucket: bucketName
        })
  
        await client.send(deleteProfileImage)
      }


    await this.prisma.boardFileUpload.deleteMany({
      where: {
        boardId
      }
    })
  }
}



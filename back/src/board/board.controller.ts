import { Controller, Get, HttpCode, HttpStatus, Query, ParseIntPipe, Body, Post, UseGuards, Param, Put, UnauthorizedException, Delete, NotFoundException, UseInterceptors } from '@nestjs/common';
import { BoardService } from './board.service';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMsg } from 'src/common/decorators/response-message.decorator';
import { CreateBoardDto } from './dto/create-board.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateBoardDto } from './dto/update-board.dto';
import { ResponseTransformInterceptor } from 'src/common/interceptors/response-transform.interceptor';

@Controller('boards')
@ApiTags('BOARD')
@UseInterceptors(ResponseTransformInterceptor)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @ApiOperation({ 
    summary: '게시글 작성',
    description: '게시글을 작성합니다.'
  })
  @ApiOkResponse({
    description: '게시글을 성공적으로 작성하였습니다.',
    type: CreateBoardDto
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('게시글을 성공적으로 작성하였습니다.')
  @Post()
  async createBoard(
    @Body() createBoardDto: CreateBoardDto,
    @User() user,
    ) {
    const user_id = user.userId;

    createBoardDto.userId = user_id
    
    const createdBoard = await this.boardService.createBoard(createBoardDto);

    const { userId, ...createdBoardWithoutUserId } = createdBoard

    return {
      data: createdBoardWithoutUserId,
    }
  }


  @ApiOperation({ 
    summary: '모든 게시글 조회',
    description: '모든 게시글을 조회합니다.'
  })
  @ApiOkResponse({
    description: '모든 게시글을 성공적으로 조회하였습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('모든 게시글을 성공적으로 조회하였습니다.')
  @Get('views')
  async getAllBoard(
    @Query('perPage', ParseIntPipe) perPage: number,
    @Query('page', ParseIntPipe) page: number,
  ) {
    const getAllBoards = await this.boardService.getAllBoards(perPage, page);

    return {
      data: getAllBoards,
    }
  }

  @ApiOperation({ 
    summary: '특정 카테고리 게시글 조회',
    description: '해당 카테고리의 모든 게시글을 조회합니다.'
  })
  @ApiOkResponse({
    description: '해당 카테고리의 모든 게시글을 성공적으로 조회하였습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('해당 카테고리의 모든 게시글을 성공적으로 조회하였습니다.')
  @Get('views/:category_id')
  async getSpecificCategoryBoard(
    @Param('category_id', ParseIntPipe) categoryId: number,
    @Query('perPage', ParseIntPipe) perPage: number,
    @Query('page', ParseIntPipe) page: number,
  ) {
    const getSpecificCategoryBoards = await this.boardService.getSpecificCategoryBoards(perPage, page, categoryId);

    return {
      data: getSpecificCategoryBoards,
    }
  }

  @ApiOperation({ 
    summary: '특정 게시글 조회',
    description: '해당 게시글을 조회합니다.'
  })
  @ApiOkResponse({
    description: '해당 게시글을 성공적으로 조회하였습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('해당 게시글을 성공적으로 조회하였습니다.')
  @Get('view/:board_id')
  async getSpecificBoard(
    @Param('board_id', ParseIntPipe) boardId: number,
  ) {
    const getSpecificBoard = await this.boardService.getSpecificBoard(boardId);
    if (!getSpecificBoard) {
      throw new NotFoundException('해당 게시글은 존재하지 않습니다.')
    }

    return {
      data: getSpecificBoard,
    }
  }

  @ApiOperation({ 
    summary: '게시글 업데이트',
    description: '게시글을 업데이트합니다.'
  })
  @ApiOkResponse({
    description: '게시글을 성공적으로 업데이트하였습니다.',
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('게시글을 성공적으로 업데이트하였습니다.')
  @Put(':board_id')
  async updateBoard(
    @Param('board_id', ParseIntPipe) boardId: number,
    @Body() updateBoardDto: UpdateBoardDto,
    @User() user,
  ) {
    const user_id = user.userId;
    const getBoardData = await this.boardService.getBoardCreateUserId(boardId);

    if (getBoardData.userId !== user_id) {
      throw new UnauthorizedException('해당 게시글 작성자가 아니므로 수정이 불가합니다.')
    }

    const updateBoard = await this.boardService.updateBoard(boardId, updateBoardDto);
    return {
      data: updateBoard,
    }
  }

  @ApiOperation({ 
    summary: '게시글 삭제',
    description: '게시글을 삭제합니다.'
  })
  @ApiOkResponse({
    description: '게시글을 성공적으로 삭제하였습니다.',
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('게시글을 성공적으로 삭제하였습니다.')
  @Delete(':board_id')
  async deleteBoard(
    @Param('board_id', ParseIntPipe) boardId: number,
    @User() user,
  ) {
    const user_id = user.userId;
    const getBoardData = await this.boardService.getBoardCreateUserId(boardId);

    if (getBoardData.userId !== user_id) {
      throw new UnauthorizedException('해당 게시글 작성자가 아니므로 삭제가 불가합니다.')
    }

    await this.boardService.deleteBoard(boardId);

    return {}
  }
}

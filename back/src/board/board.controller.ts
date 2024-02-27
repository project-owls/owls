import { Controller, Get, HttpCode, HttpStatus, Query, ParseIntPipe, Body, Post, UseGuards, Param, Put, UnauthorizedException, Delete, NotFoundException, UseInterceptors, DefaultValuePipe } from '@nestjs/common';
import { BoardService } from './board.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMsg } from 'src/common/decorators/response-message.decorator';
import { CreateBoardDto } from './dto/create-board.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateBoardDto } from './dto/update-board.dto';
import { ResponseTransformInterceptor } from 'src/common/interceptors/response-transform.interceptor';
import { BoardDto } from 'src/common/dto/board.dto';

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
    const {userId} = user;

    createBoardDto.userId = userId
    
    const createdBoard = await this.boardService.createBoard(createBoardDto);

    delete createdBoard.userId

    return {
      data: createdBoard,
    }
  }


  @ApiOperation({ 
    summary: '카테고리 게시글 조회',
    description: '해당 카테고리의 모든 게시글을 조회합니다.'
  })
  @ApiOkResponse({
    description: '해당 카테고리의 모든 게시글을 성공적으로 조회하였습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('해당 카테고리의 모든 게시글을 성공적으로 조회하였습니다.')
  @Get('views')
  async getSpecificCategoryBoard(
    @Query('category_id', new DefaultValuePipe(1), ParseIntPipe) categoryId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('sort') sort: string,
  ) {
    const getSpecificCategoryBoards = await this.boardService.getSpecificCategoryBoards(page, categoryId, sort);

    if (getSpecificCategoryBoards.boardTotalCount === 0) {
      throw new NotFoundException('해당 카테고리의 게시글이 없어요')
    }

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

    await this.boardService.increseBoardviews(boardId);

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
    const {userId} = user;
    const getBoardData = await this.boardService.getBoardCreateUserId(boardId);

    if (getBoardData.userId !== userId) {
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
    const {userId} = user;
    const getBoardData = await this.boardService.getBoardCreateUserId(boardId);

    if (getBoardData.userId !== userId) {
      throw new UnauthorizedException('해당 게시글 작성자가 아니므로 삭제가 불가합니다.')
    }

    await this.boardService.deleteBoard(boardId);

    return {}
  }

  @ApiOperation({ 
    summary: '게시글 좋아요',
    description: '게시글 좋아요 추가/삭제합니다.'
  })
  @ApiOkResponse({
    description: `추가: 해당 게시글에 좋아요를 눌렀어요!,
    취소: 해당 게시글의 좋아요를 취소했어요.`
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @Post('like/:board_id')
  async likeSwith(
    @Param('board_id', ParseIntPipe) boardId: number,
    @User() user,
  ) {
    const {userId} = user;
    const searchLike = await this.boardService.searchLike(boardId, userId);

    if (searchLike) {
      await this.boardService.deleteLike(boardId, userId);
      return { message: '해당 게시글의 좋아요를 취소했어요.' }
    } else {
      await this.boardService.createLike(boardId, userId);
      return { message: '해당 게시글에 좋아요를 눌렀어요!' }
    }
  }

  @ApiOperation({ 
    summary: '카테고리 인기글 조회',
    description: '해당 카테고리 인기글을 조회합니다.'
  })
  @ApiOkResponse({
    description: '해당 카테고리 인기글을 성공적으로 조회하였습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('해당 카테고리 인기글을 성공적으로 조회하였습니다.')
  @Get('views/popular/:category_id')
  async getPopularBoards(
    @Param('category_id', new DefaultValuePipe(1), ParseIntPipe) categoryId: number,
  ) {
    const getSpecificCategoryBoardsSinceAWeekAgo = await this.boardService.getSpecificCategoryPopularBoardsSinceAWeekAgo(categoryId);

    return { data: getSpecificCategoryBoardsSinceAWeekAgo }
  }

  @ApiOperation({ 
    summary: '게시글 검색',
    description: '주어진 검색어로 게시글을 검색합니다.'
  })
  @ApiOkResponse({
    description: '게시글을 성공적으로 검색하였습니다.',
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('게시글을 성공적으로 검색하였습니다.')
  @Get('views/search')
  async searchBoards(
    @Query('category_id', new DefaultValuePipe(1), ParseIntPipe) categoryId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('sort') sort: string,
    @Query('search') search: string,
  ) {
    const searchBoards = await this.boardService.searchBoards(categoryId, search, page, sort);

    if (searchBoards.boardTotalCount === 0) {
      throw new NotFoundException(`${search}와 일치하는 검색결과가 없어요`)
    }

    return {
      data: searchBoards,
    }
  }
}

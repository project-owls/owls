import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpCode, HttpStatus, Put, NotFoundException, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/common/decorators/user.decorator';
import { ResponseMsg } from 'src/common/decorators/response-message.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllCommentsDto } from './dto/all-comments.dto';
import { ResponseTransformInterceptor } from 'src/common/interceptors/response-transform.interceptor';

@Controller('comments')
@ApiTags('COMMENT')
@UseInterceptors(ResponseTransformInterceptor)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiOperation({ 
    summary: '댓글 작성',
    description: '댓글을 작성합니다.'
  })
  @ApiOkResponse({
    description: '댓글을 성공적으로 작성하였습니다.',
    type: CreateCommentDto
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('댓글을 성공적으로 작성하였습니다.')
  @Post(':board_id')
  async createComment(
    @Param('board_id', ParseIntPipe) boardId: number,
    @Body() createCommentDto :CreateCommentDto,
    @User() user 
  ) {
    const { userId } = user
    createCommentDto.userId = userId
    createCommentDto.boardId = boardId

    if (createCommentDto.parentComment && !await this.commentService.getComment(createCommentDto.parentComment)) {
      throw new NotFoundException('부모 댓글이 없습니다. 대댓글이 아닌 댓글로 작성해주세요.')
    }

    const createComment = await this.commentService.createComment(createCommentDto)

    return {
      data: createComment
    }
  }

  @ApiOperation({ 
    summary: '댓글 조회',
    description: 'param(board_id)의 댓글을 조회합니다.'
  })
  @ApiOkResponse({
    description: '댓글을 성공적으로 조회하였습니다.',
    type: AllCommentsDto
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('댓글을 성공적으로 조회하였습니다.')
  @Get(':board_id')
  async getSpecificBoardComments(
    @Param('board_id', ParseIntPipe) boardId: number
  ) {
    const getSpecificBoardComments = await this.commentService.getSpecificBoardComments(boardId)

    if (getSpecificBoardComments.comments.length === 0) {
      throw new NotFoundException('해당 게시글에 댓글이 없습니다.')
    }

    return {
      data: getSpecificBoardComments
    }
  }

  @ApiOperation({ 
    summary: '댓글 업데이트',
    description: 'param(comment_id)의 댓글을 업데이트합니다.'
  })
  @ApiOkResponse({
    description: '댓글을 성공적으로 업데이트하였습니다.',
    type: UpdateCommentDto
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('댓글을 성공적으로 업데이트하였습니다.')
  @Put(':comment_id')
  async updateComment(
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @User() user
  ) {
    const { userId } = user

    const getComment = await this.commentService.getComment(commentId);
    console.log(userId)

    if (!getComment) {
      throw new NotFoundException('해당 댓글을 찾을 수 없습니다.')
    }

    if (getComment.userId !== userId) {
      throw new UnauthorizedException('해당 댓글 작성자가 아니므로 수정이 불가합니다.')
    }

    const updateComment = await this.commentService.updateComment(commentId, updateCommentDto)

    return {
      data: updateComment
    }
  }

  @ApiOperation({ 
    summary: '댓글 삭제',
    description: 'param(comment_id)의 댓글을 삭제합니다.'
  })
  @ApiOkResponse({
    description: '댓글을 성공적으로 삭제하였습니다.',
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @HttpCode(HttpStatus.OK)
  @ResponseMsg('댓글을 성공적으로 삭제하였습니다.')
  @Delete(':comment_id')
  async deleteComment(
    @Param('comment_id', ParseIntPipe) commentId: number,
    @User() user
  ) {
    const { userId } = user

    const getComment = await this.commentService.getComment(commentId);

    if (!getComment) {
      throw new NotFoundException('해당 댓글을 찾을 수 없습니다.')
    }

    if (getComment.userId !== userId) {
      throw new UnauthorizedException('해당 댓글 작성자가 아니므로 삭제가 불가합니다.')
    }

    await this.commentService.deleteComment(commentId)

    return {}
  }

  @ApiOperation({ 
    summary: '댓글 좋아요',
    description: 'param(comment_id)의 댓글 좋아요 추가/삭제합니다.'
  })
  @ApiOkResponse({
    description: `추가: 해당 댓글에 좋아요를 눌렀어요!,
    취소: 해당 댓글의 좋아요를 취소했어요.`,
  })
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard('accessToken'))
  @Post('like/:comment_id')
  async commnetLikeSwitch(
    @Param('comment_id', ParseIntPipe) commentId: number,
    @User() user
  ) {
    const { userId } = user

    const getComment = await this.commentService.getComment(commentId);

    if (!getComment) {
      throw new NotFoundException('해당 댓글을 찾을 수 없습니다.')
    }

    const searchCommentLike = await this.commentService.searchCommentLike(commentId, userId);

    if (searchCommentLike) {
      await this.commentService.deleteCommentLike(commentId, userId);
      return { message: '해당 댓글의 좋아요를 취소했어요.' }
    } else {
      await this.commentService.createCommentLike(commentId, userId);
      return { message: '해당 댓글에 좋아요를 눌렀어요!' }
    }
  }
}

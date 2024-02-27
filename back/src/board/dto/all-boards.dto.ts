import { BoardDto } from "src/common/dto/board.dto";

export class AllBoardsDto {
  boards: Partial<BoardDto>[];
  category?: string;
  boardTotalCount?: number;
  boardTotalPage?: number;
}
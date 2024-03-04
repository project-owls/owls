export class CreateCommentDto {
  id: number;
  content: string;
  createdAt: Date;
  userId: string;
  boardId: number;
  parentComment?: number;
}

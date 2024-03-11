export class CommentDto {
  id: number;
  content: string;
  createdAt: Date;
  userId: string;
  boardId: number;
  parentComment?: number;
  user?: {
    nickname: string,
  };
  reComment?: {
    content: string,
    createdAt: Date,
    likeCount: number,
    user: {
      nickname: string,
      profileImage: {
        url: string,
      },
    }
  };
}

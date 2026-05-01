// 投稿統合用インターフェース
export interface Post {
  postId: number;
  title: string;
  likes: number;
  dislikes: number;
  views: number;
  createdAt: string;
  comments: { id: number }[];
  board: { name: string };
  user?: { alias: string };
}
export type UserRole = "USER" | "MANAGER" | "ADMIN";

// 現在のユーザー情報のインターフェース: ログインIDと、オプションで権限ロールを保持
export interface CurrentUser {
  loginId: string;
  role?: UserRole | null;
}

// コメント投稿ユーザーのインターフェース
export interface CommentUser {
  alias: string;
  loginId: string;
  profileImg?: string | null;
  role?: UserRole | null;
}

// コメントデータのインターフェース
export interface CommentData {
  commentId: number;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  postId: number;
  user: CommentUser;
  parentId?: number | null;
  parent?: { commentId: number } | null;
}
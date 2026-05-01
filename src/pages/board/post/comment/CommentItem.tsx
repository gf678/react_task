import { useEffect, useState } from "react";
import api from "../../../../api/axios";
import { normalizeProfileImg } from "../../../../utils/profileImage";
import type { CommentData, CurrentUser, UserRole } from "./CommentTypes";

// 権限レベルの定義: USER < MANAGER < ADMIN
const ROLE_LEVEL: Record<UserRole, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

// 権限レベルを取得する関数: 権限がない、または不明な場合は USER レベルを返す
const getRoleLevel = (role?: UserRole | null) =>
  ROLE_LEVEL[role ?? "USER"] ?? ROLE_LEVEL.USER;

// コメントアイテムコンポーネントのProps定義
interface Props {
  comment: CommentData;
  depth: number;
  currentUser: CurrentUser | null;
  setParentId: (id: number | null) => void;
  onEditSuccess: (commentId: number, content: string) => void;
  onDeleteSuccess: (commentId: number) => void;
}

/**
 * コメントアイテムコンポーネント
 * コメント内容、投稿者情報、投稿時間の表示、および返信/編集/削除機能を提供。
 * 権限に応じて編集/削除ボタンの表示を制御する。
 */
const CommentItem = ({
  comment,
  depth,
  currentUser,
  setParentId,
  onEditSuccess,
  onDeleteSuccess,
}: Props) => {
  // ステート管理: 編集モード、編集中のテキスト、APIリクエストのローディング状態
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [loading, setLoading] = useState(false);

  // コメント内容が変更された場合、編集用テキストを最新の状態に更新
  useEffect(() => {
    setEditText(comment.content);
  }, [comment.content]);

  // コメントの深さ(depth)に基づいたインデント計算: 最大4段階まで適用
  const indent = Math.min(depth, 4) * 22;
  const formatDate = (date?: string) => (date ? new Date(date).toLocaleString() : "");

  // 権限判定: 投稿者本人か、または権限レベルに基づく修正/削除権限の計算
  const isMyComment = currentUser?.loginId === comment.user.loginId;
  const myRoleLevel = getRoleLevel(currentUser?.role);
  const authorRoleLevel = getRoleLevel(comment.user.role);

  // 編集権限: 本人のみ可能。削除権限: 本人、または自分より低い権限レベルのユーザーのコメントを削除可能
  const canEdit = !comment.isDeleted && isMyComment;
  const canDelete =
    !comment.isDeleted && (isMyComment || myRoleLevel > authorRoleLevel);

  // 削除処理: APIを呼び出し、成功時に親コンポーネントのコールバックを実行
  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(
        `/api/comments/posts/${comment.postId}/comments/${comment.commentId}`
      );
      onDeleteSuccess(comment.commentId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 編集保存処理: 入力チェック後、APIを呼び出して内容を更新
  const handleEdit = async () => {
    const content = editText.trim();

    // バリデーション: 内容が空の場合は更新不可
    if (!content) {
      return;
    }

    try {
      setLoading(true);
      await api.put(
        `/api/comments/posts/${comment.postId}/comments/${comment.commentId}`,
        { content }
      );
      onEditSuccess(comment.commentId, content);
      setEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // レンダリング: 削除済みコメントの処理や、権限に応じたUIの切り替えを含む
  return (
    <div className="relative" style={{ marginLeft: indent }}>
      {/* 返信時のツリー構造を示すインジケーター */}
      {depth > 0 && (
        <>
          <div className="absolute -left-3 top-0 h-full w-px bg-gradient-to-b from-pink-200 via-pink-100 to-transparent" />
          <div className="absolute -left-[17px] top-6 h-2.5 w-2.5 rounded-full bg-pink-300 ring-4 ring-white" />
        </>
      )}

      <div
        className={`rounded-2xl border px-4 py-4 shadow-sm transition ${
          comment.isDeleted
            ? "border-gray-100 bg-gray-50/80"
            : depth === 0
              ? "border-gray-100 bg-white"
              : "border-pink-100 bg-rose-50/50"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* プロフィール画像表示 */}
          {comment.user?.profileImg ? (
            <img
              src={normalizeProfileImg(comment.user.profileImg)}
              alt={comment.user.alias}
              className="h-10 w-10 rounded-full border border-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-indigo-100 text-sm font-semibold text-gray-700">
              {comment.user?.alias?.[0] ?? "?"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {comment.user.alias}
              </span>

              {depth > 0 && (
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-600">
                  ↳ リプライ
                </span>
              )}

              <span className="text-xs text-gray-400">
                {formatDate(comment.createdAt)}
              </span>
            </div>

            {/* コメント本文または編集フォーム */}
            {comment.isDeleted ? (
              <div className="mt-2 rounded-xl bg-white/70 px-3 py-3 text-sm italic text-gray-400">
                削除されたコメントです。
              </div>
            ) : editing ? (
              <div className="mt-3">
                <textarea
                  className="min-h-[96px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  disabled={loading}
                />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleEdit}
                    disabled={loading}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-black disabled:opacity-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    disabled={loading}
                    className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {comment.content}
              </div>
            )}

            {/* 操作ボタン群 (返信/編集/削除) */}
            {!comment.isDeleted && !editing && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => setParentId(comment.commentId)}
                  className="rounded-lg px-2.5 py-1.5 font-medium text-gray-500 transition hover:bg-pink-50 hover:text-pink-600"
                >
                  リプライ
                </button>

                {canEdit && (
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-lg px-2.5 py-1.5 font-medium text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    編集
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="rounded-lg px-2.5 py-1.5 font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    削除
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
import type { ReactNode } from "react";
import CommentItem from "./CommentItem";
import type { CommentData, CurrentUser } from "./CommentTypes";

// コメントツリーコンポーネントのProps定義
interface Props {
  comments: CommentData[];
  currentUser: CurrentUser | null;
  setParentId: (id: number | null) => void;
  onEditSuccess: (commentId: number, content: string) => void;
  onDeleteSuccess: (commentId: number) => void;
}

/**
 * コメントツリーコンポーネント
 * コメントデータを親子関係に基づいてグループ化し、再帰的にレン더リングする。
 * 各コメントは CommentItem を使用して表示され、子コメントがある場合はインデントを適用して階層構造を表現する。
 */
const CommentTree = ({
  comments,
  currentUser,
  setParentId,
  onEditSuccess,
  onDeleteSuccess,
}: Props) => {
  // コメントの親IDを取得するヘルパー関数。親IDが設定されていない場合は最上位(null)とみなす。
  const getParentId = (comment: CommentData) =>
    comment.parentId ?? comment.parent?.commentId ?? null;

  // 親IDをキーとし、その親に属するコメント配列を値とするMapオブジェクトを作成。
  const childrenMap = comments.reduce((map, comment) => {
    const parentId = getParentId(comment);
    const bucket = map.get(parentId);

    if (bucket) bucket.push(comment);
    else map.set(parentId, [comment]);

    return map;
  }, new Map<number | null, CommentData[]>());

  /**
   * ツリーを再帰的にレンダリングする関数
   * @param parentId 現在の階層の親ID
   * @param depth 階層の深さ (インデント計算用)
   */
  const renderTree = (parentId: number | null, depth = 0): ReactNode => {
    const children = childrenMap.get(parentId) ?? [];

    // 該当する親IDを持つコメントを順にレンダリングし、その子コメントに対しても再帰的に実行
    return children.map((comment) => (
      <div key={comment.commentId} className="space-y-3">
        <CommentItem
          comment={comment}
          depth={depth}
          currentUser={currentUser}
          setParentId={setParentId}
          onEditSuccess={onEditSuccess}
          onDeleteSuccess={onDeleteSuccess}
        />
        {/* 子コメントのレンダリング (深さを+1して再帰呼び出し) */}
        {renderTree(comment.commentId, depth + 1)}
      </div>
    ));
  };

  // 最上位階層(parentId: null)からレンダリングを開始
  return <div className="space-y-3">{renderTree(null)}</div>;
};

export default CommentTree;
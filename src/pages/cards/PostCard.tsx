import React from "react";
import { Link } from "react-router-dom";

/**
 * PostCard コンポーネントで使用するプロパティの型定義
 */
interface Props {
  postId: number;     // 投稿ID
  title: string;      // タイトル
  writer: string;     // 投稿者
  comment: number;    // コメント数
  boardname: string;  // 掲示板名
  thumbs: number;     // おすすめ数 (いいね)
  views: number;      // 閲覧数
}

/**
 * 投稿カードコンポーネント (リストやホーム画面で使用)
 */
const PostCard: React.FC<Props> = ({
  postId,
  title,
  writer,
  comment,
  boardname,
  thumbs,
  views
}) => {

  // 掲示板名がない場合のデフォルト値を設定
  const safeBoard = boardname || "不明";

  return (
    // カード全体をクリックすると投稿詳細ページへ遷移
    <Link
      to={`/board/${encodeURIComponent(safeBoard)}/post/${postId}`}
      className="block"
    >
      <div className="h-full rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-100 hover:shadow-md">

        {/* ===== 上部エリア (タイトル + 掲示板タグ) ===== */}
        <div className="mb-4 flex items-start justify-between gap-3">

          {/* タイトルエリア */}
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-6 text-gray-900">

              {/* タイトル */}
              {title}

              {/* コメント数がある場合にタイトルの横に表示 */}
              {comment > 0 && (
                <span className="text-red-500 ml-1">
                  [{comment}]
                </span>
              )}
            </h3>
          </div>

          {/* 掲示板名のバッジ表示 */}
          <span className="shrink-0 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-600">
            {safeBoard}
          </span>
        </div>

        {/* ===== 下部エリア (投稿者 + おすすめ/閲覧数) ===== */}
        <div className="flex items-center justify-between gap-3">

          {/* 投稿者 */}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-700">
              {writer}
            </p>
          </div>

          {/* おすすめ数 / 閲覧数 */}
          <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">

            {/* おすすめ数 (いいね) */}
            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              👍 {thumbs}
            </span>

            {/* 閲覧数 */}
            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              👁 {views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
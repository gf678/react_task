import React from "react";
import { Link } from "react-router-dom";
import type { Post } from "../../types/post";

/**
 * プロパティの型定義
 */
interface Props {
  boardTitle: string; // 掲示板タイトル
  posts: Post[];      // 投稿リスト
}

/**
 * 掲示板カードコンポーネント
 * ホーム画面などで各掲示板の最新投稿をプレビューするために使用
 */
const BoardCard: React.FC<Props> = ({ boardTitle, posts }) => {

  /**
   * 日付を MM.DD 形式に変換する関数
   */
  const formatDate = (date?: string) => {
    if (!date) return ""; // 日付がない場合は空文字を返す

    const d = new Date(date);

    // 月と日を2桁に揃えて返す (例: 04.09)
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}.${d
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    // カード全体のコンテナ
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      {/* ===== ヘッダー (掲示板タイトル + 投稿数) ===== */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between gap-3">

          {/* 掲示板一覧へのリンク */}
          <Link
            to={`/board/${boardTitle}/list`}
            className="truncate text-lg font-semibold text-gray-900 transition hover:text-pink-600"
          >
            {boardTitle}
          </Link>

          {/* 投稿件数の表示 */}
          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
            {posts.length} posts
          </span>
        </div>
      </div>

      {/* ===== 投稿リスト ===== */}
      <ul className="divide-y divide-gray-100">
        {posts.length > 0 ? (
          // 投稿がある場合 → 最大5件まで表示
          posts.slice(0, 5).map((post) => (
            <li key={post.postId}>
              <Link
                to={`/board/${boardTitle}/post/${post.postId}`}
                className="block px-5 py-4 transition hover:bg-pink-50/40"
              >
                <div className="flex items-start justify-between gap-3">

                  {/* ===== 左側エリア (タイトル + 投稿者 + 日付) ===== */}
                  <div className="min-w-0 flex-1">

                    {/* 投稿タイトル */}
                    <div className="truncate text-sm font-medium text-gray-800">
                      {post.title}

                      {/* コメント数がある場合に表示 */}
                      {post.comments?.length ? (
                        <span className="text-red-500 ml-2">
                          [{post.comments.length}]
                        </span>
                      ) : null}
                    </div>

                    {/* 投稿者 + 日付 */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>{post.user?.alias ?? "匿名"}</span> {/* 投稿者 (不明な場合は匿名) */}
                      <span>{formatDate(post.createdAt)}</span> {/* 日付 */}
                    </div>
                  </div>

                  {/* ===== 右側エリア (おすすめ / 閲覧数) ===== */}
                  <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      👍 {post.likes - post.dislikes} {/* おすすめ数 (Good - Bad) */}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      👁 {post.views} {/* 閲覧数 */}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))
        ) : (
          // 投稿が1件もない場合
          <li className="px-5 py-10 text-center text-sm text-gray-400">
            <Link
              to={`/board/${boardTitle}/write`}
              className="transition hover:text-pink-500"
            >
              最初の投稿をしてみましょう！
            </Link>
          </li>
        )}
      </ul>

      {/* ===== フッター (すべて見るリンク) ===== */}
      <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3">
        <Link
          to={`/board/${boardTitle}/list`}
          className="text-sm font-medium text-gray-600 transition hover:text-pink-600"
        >
          もっと見る
        </Link>
      </div>
    </div>
  );
};

export default BoardCard;
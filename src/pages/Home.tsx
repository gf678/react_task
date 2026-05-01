import React, { useEffect, useState } from "react";
import PostCard from "./cards/PostCard";
import BoardCard from "./cards/BoardCard";
import api from "../api/axios";
import type { Post } from "../types/post";

interface Board {
  id?: number;
  name: string;
}

const Home: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardMap, setBoardMap] = useState<Record<string, Post[]>>({});
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // コンポーネントのマウント時に掲示板リストと投稿データを取得
  useEffect(() => {
    void loadHome();
  }, []);

  const loadHome = async () => {
    try {
      setLoading(true);

      const boardRes = await api.get("/api/boards");

      // バックエンドのレスポンス形式（配列、data、boards）の揺れを吸収して処理
      const boardsData: Board[] = Array.isArray(boardRes.data)
        ? boardRes.data
        : boardRes.data?.data ?? boardRes.data?.boards ?? [];

      setBoards(boardsData);

      // 各掲示板の最新投稿を並列で取得
      const postPromises = boardsData.map((b) => api.get(`/api/posts/${b.name}`));
      const postResults = await Promise.all(postPromises);

      const map: Record<string, Post[]> = {};

      postResults.forEach((res, idx) => {
        const boardName = boardsData[idx]?.name;

        const posts: Post[] = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? [];

        // 投稿データに掲示板情報が欠けている場合の補完処理
        const safePosts = posts.map((p: any) => ({
          ...p,
          board: p.board ?? { name: boardName ?? "unknown" },
        }));

        if (boardName) {
          map[boardName] = safePosts;
        }
      });

      setBoardMap(map);

      // 全投稿を「いいね数」順にソートし、人気投稿リスト（Top 10）を作成
      const allPosts = Object.values(map).flat();
      const sorted = [...allPosts].sort(
        (a: any, b: any) => (b.likes ?? 0) - (a.likes ?? 0),
      );

      setPopularPosts(sorted.slice(0, 10));
    } catch (err) {
      console.error("Home load error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* ヘッダーセクション：掲示板数と人気投稿数のサマリー表示 */}
        <section className="rounded-3xl border border-white/70 bg-white/90 px-6 py-7 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                Community Hub
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                今日の掲示板
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                人気投稿と掲示板別の最新の流れを一度に確認できるホーム画面です。
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <p className="text-xs text-gray-500">Boards</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {boards.length}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <p className="text-xs text-gray-500">Popular</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {popularPosts.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 人気投稿セクション */}
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">人気投稿</h2>
              <p className="mt-1 text-sm text-gray-500">
                反応の良い投稿を優先して確認できます。
              </p>
            </div>
            <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
              Top 10
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">読み込み中...</div>
          ) : popularPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {popularPosts.map((post) => (
                <PostCard
                  key={post.postId}
                  postId={post.postId}
                  title={post.title}
                  writer={post.user?.alias ?? "匿名"}
                  boardname={post.board?.name ?? "unknown"}
                  thumbs={post.likes - post.dislikes}
                  comment={post.comments?.length ?? 0}
                  views={post.views}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">
              人気投稿がありません。
            </div>
          )}
        </section>

        {/* 掲示板別セクション */}
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">掲示板</h2>
            <p className="mt-1 text-sm text-gray-500">
              掲示板ごとの最新投稿を素早く確認できます。
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">読み込み中...</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {boards.map((b) => (
                <BoardCard
                  key={b.name}
                  boardTitle={b.name}
                  posts={boardMap[b.name] ?? []}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
import { useNavigate } from "react-router-dom";

/**
 * 掲示板ページコンポーネント (BoardPage)
 * 掲示板のリスト表示、フィルタリング、ページネーションなどのUIを担当
 */
const BoardPage = ({
  boardName,
  board,
  posts,
  subscribed,
  loading,
  page,
  setPage,
  size,
  setSize,
  sort,
  setSort,
  keyword,
  setKeyword,
  onToggleSubscription,
  onWrite,
  reload,
}: any) => {
  const navigate = useNavigate();

  // 投稿クリック時に詳細ページへ遷移
  const goPost = (postId: number) => {
    navigate(`/board/${boardName}/post/${postId}`);
  };

  // ローディング中のUI
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/70 bg-white/80 p-10 text-center text-gray-400 shadow-sm backdrop-blur">
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* 掲示板ヘッダーエリア */}
        <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 border-b border-gray-100 px-6 py-7 md:flex-row md:items-start md:justify-between">
            
            {/* 掲示板情報 */}
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
                BOARD
              </div>

              {/* 掲示板名 */}
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                {boardName}
              </h1>

              {/* 掲示板の説明 */}
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                {board?.description ?? "掲示板の説明がありません。"}
              </p>
            </div>

            {/* 購読ボタン */}
            <button
              onClick={onToggleSubscription}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                subscribed
                  ? "bg-gray-900 text-white hover:bg-black"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {subscribed ? "購読中" : "購読する"}
            </button>
          </div>

          {/* フィルタ / 検索 / オプションエリア */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_auto_auto] md:items-center">

            {/* ソートボタン */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSort("latest")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  sort === "latest"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                最新順
              </button>

              <button
                onClick={() => setSort("popular")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  sort === "popular"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                人気順
              </button>
            </div>

            {/* 検索エリア */}
            <div className="flex w-full gap-2 md:w-[320px]">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                placeholder="キーワード検索"
              />

              {/* 検索ボタン */}
              <button
                onClick={reload}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
              >
                検索
              </button>
            </div>

            {/* 表示件数設定 + 新規投稿ボタン */}
            <div className="flex items-center justify-between gap-2 md:justify-end">

              {/* 1ページあたりの表示件数 */}
              <div className="flex rounded-xl bg-gray-100 p-1">
                {[15, 30].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[52px] rounded-lg px-3 py-1.5 text-sm transition ${
                      size === s
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* 新規投稿ボタン */}
              <button
                onClick={onWrite}
                className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-600"
              >
                投稿作成
              </button>
            </div>
          </div>
        </section>

        {/* 投稿リスト */}
        <section className="rounded-3xl border border-white/70 bg-white/90 p-3 shadow-sm backdrop-blur">
          <div className="space-y-2">

            {/* 投稿の繰り返しレンダリング */}
            {posts.map((post: any) => (
              <button
                key={post.postId}
                type="button"
                onClick={() => goPost(post.postId)}
                className="group flex w-full flex-col gap-4 rounded-2xl border border-transparent bg-white px-5 py-4 text-left transition hover:border-pink-100 hover:bg-pink-50/40 hover:shadow-sm md:flex-row md:items-center md:justify-between"
              >
                {/* 左側エリア (タイトル + メタ情報) */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">

                    {/* タイトル */}
                    <span className="truncate text-base font-semibold text-gray-900 transition group-hover:text-pink-600">
                      {post.title}
                    </span>

                    {/* コメント数表示 */}
                    {(post.comments?.length ?? 0) > 0 && (
                      <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                        {post.comments.length}
                      </span>
                    )}
                  </div>

                  {/* メタ情報 */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>{post.user?.alias ?? "匿名"}</span>
                    <span>コメント {post.comments?.length ?? 0}</span>
                    <span>おすすめ {post.likes - post.dislikes}</span>
                    <span>
                      {new Date(post.createdAt)
                        .toISOString()
                        .slice(0, 10)}
                    </span>
                  </div>
                </div>

                {/* 右側サマリー情報 */}
                <div className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1">
                    💬 {post.comments?.length ?? 0}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1">
                    👍 {post.likes - post.dislikes}
                  </span>
                </div>
              </button>
            ))}

            {/* 投稿がない場合 */}
            {posts.length === 0 && (
              <div className="rounded-2xl px-6 py-12 text-center text-sm text-gray-400">
                投稿がありません
              </div>
            )}
          </div>
        </section>

        {/* ページネーション */}
        <div className="flex items-center justify-center gap-3">

          {/* 前のページ */}
          <button
            disabled={page === 0}
            onClick={() => setPage(Math.max(page - 1, 0))}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            前へ
          </button>

          {/* 現在のページ */}
          <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
            {page + 1}
          </div>

          {/* 次의ページ */}
          <button
            onClick={() => setPage(page + 1)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
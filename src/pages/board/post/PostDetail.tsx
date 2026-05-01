import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CommentTree from "./comment/CommentTree";
import api from "../../../api/axios";
import type { CommentData, CurrentUser, UserRole } from "./comment/CommentTypes";

// ユーザー情報のインターフェース: ニックネーム、ログインID、オプションで権限ロールを保持
interface User {
  alias: string;
  loginId: string;
  role?: UserRole | null;
}

// 投稿データのインターフェース: 投稿ID、タイトル、内容、作成日時、閲覧数、いいね/よくないね数、投稿者情報、コメント配列などを含む
interface Post {
  postId: number;
  title: string;
  content: string;
  createdAt: string;
  views: number;
  likes: number;
  dislikes: number;
  user: User;
  comments: CommentData[];
}

/**
 * 投稿詳細ページコンポーネント
 * URLパラメータから投稿IDと掲示板名を取得し、該当する投稿の詳細情報を表示する。
 * 投稿内容、投稿者、閲覧数、評価機能に加え、コメントツリーによる一覧表示と投稿機能を提供。
 */
const PostDetail = () => {
  // React Routerの useNavigate と useParams フックを使用
  const navigate = useNavigate();
  const { boardName, postId } = useParams();

  const [post, setPost] = useState<Post | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const viewedPostRef = useRef<string | null>(null);

  // 投稿データをロードする関数: APIからデータを取得し、評価（いいね等）をステートに反映
  const loadPost = async () => {
    const res = await api.get(`/api/posts/${boardName}/${postId}`);
    const data = res.data as Post;
    setPost(data);
    setLikes(data.likes);
    setDislikes(data.dislikes);
  };

  /**
   * コンポーネントマウント時およびパラメータ変更時のデータ取得
   * 同一セッションでの重複カウントを防ぐため、useRefで最後に閲覧したpostIdを保持して比較
   */
  useEffect(() => {
    const load = async () => {
      try {
        // 閲覧数カウントアップAPIの呼び出し条件判定
        if (postId && viewedPostRef.current !== postId) {
          viewedPostRef.current = postId;
          await api.post(`/api/posts/${postId}/view`);
        }
        
        // 投稿データの読み込み
        await loadPost();
        
        // 認証情報の確認: ログイン済みであればユーザー情報をステートに保存
        try {
          const me = await api.get("/api/user/me");
          setIsAuthenticated(true);
          setCurrentUser({
            loginId: me.data.loginId,
            role: me.data.role ?? "USER",
          });
        } catch {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    void load();
  }, [boardName, postId]);
  
  // コメント編集成功時のステート更新処理: 該当するコメントの内容のみを置換
  const handleCommentEdited = (commentId: number, content: string) => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments.map((comment) =>
              comment.commentId === commentId ? { ...comment, content } : comment
            ),
          }
        : prev
    );
  };

  // コメント削除成功時のステート更新処理: 削除フラグを立て、内容を削除済みメッセージに置換
  const handleCommentDeleted = (commentId: number) => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, isDeleted: true, content: "削除されたコメントです。" }
                : comment
            ),
          }
        : prev
    );
  };

  // コメント投稿処理: バリデーション後、APIを呼び出して投稿。成功時にリストを再読み込み
  const handleCommentSubmit = async () => {
    if (!commentInput.trim() || !post) return;

    await api.post(`/api/comments/posts/${post.postId}/comments`, {
      content: commentInput,
      parentId,
    });

    setCommentInput("");
    setParentId(null);
    await loadPost();
  };

  // 評価（いいね/よくないね）の処理
  const handleLike = async () => {
    if (!post) return;
    const res = await api.post(`/api/posts/${post.postId}/reaction?type=LIKE`);
    setLikes(res.data.likes);
    setDislikes(res.data.dislikes);
  };

  const handleDislike = async () => {
    if (!post) return;
    const res = await api.post(`/api/posts/${post.postId}/reaction?type=DISLIKE`);
    setLikes(res.data.likes);
    setDislikes(res.data.dislikes);
  };

  // 投稿削除処理: ユーザー確認後、削除APIを呼び出し掲示板リストへ遷移
  const handleDelete = async () => {
    if (!post) return;
    if (!confirm("本当に削除してもよろしいですか？")) return;

    await api.delete(`/api/posts/${post.postId}`);
    navigate(`/board/${boardName}/list`);
  };

  // 日付のフォーマット関数: ja-JPロケールを使用して表示
  const formatDate = (date: string) => new Date(date).toLocaleString("ja-JP");

  // ロード中のスケルトン/ローディング表示
  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/70 bg-white/90 p-10 text-center text-gray-400 shadow-sm backdrop-blur">
          loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* 投稿詳細セクション */}
        <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <div className="border-b border-gray-100 px-6 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                  Post
                </p>
                <h1 className="mt-2 break-words text-3xl font-bold text-gray-900">
                  {post.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {post.user?.alias ?? "匿名"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    閲覧数 {post.views}
                  </span>
                  <span className="rounded-full bg-pink-50 px-3 py-1 text-pink-600">
                    いいね {likes - dislikes}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/board/${boardName}/list`)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                一覧へ
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            <article
              className="prose prose-sm sm:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* 評価ボタンエリア */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleLike}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-pink-50 hover:text-pink-600"
              >
                👍 {likes}
              </button>

              <button
                onClick={handleDislike}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
              >
                👎 {dislikes}
              </button>
            </div>
          </div>

          {/* 管理メニュー (投稿者本人のみ表示) */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
            {currentUser?.loginId === post.user?.loginId && (
              <button
                onClick={() => navigate(`/board/${boardName}/update/${post.postId}`)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
              >
                編集
              </button>
            )}

            {currentUser?.loginId === post.user?.loginId && (
              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-100"
              >
                削除
              </button>
            )}
          </div>
        </section>

        {/* コメントセクション */}
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                コメント
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                合計 {post.comments?.length || 0}件のコメント
              </p>
            </div>

            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              {post.comments?.length || 0}
            </span>
          </div>
          
          <CommentTree
            comments={post.comments}
            currentUser={currentUser}
            setParentId={setParentId}
            onEditSuccess={handleCommentEdited}
            onDeleteSuccess={handleCommentDeleted}
          />

          {/* コメント入力エリア */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            {isAuthenticated ? (
              <div className="space-y-4">
                {parentId && (
                  <div className="flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-600">
                    <span>返信を入力中です。</span>
                    <button
                      type="button"
                      onClick={() => setParentId(null)}
                      className="font-medium transition hover:text-indigo-800"
                    >
                      取消
                    </button>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    コメントを書く
                  </label>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="min-h-[120px] w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                    placeholder="コメントを入力してください"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCommentSubmit}
                    className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600"
                  >
                    投稿
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                ログインが必要です。
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PostDetail;
import React from "react";

// 投稿データのインターフェース: 投稿ID、タイトル、作成日時、いいね/よくないね数、閲覧数、コメント配列、投稿者情報などを含む
interface Post {
  postId: number;
  title: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  views: number;
  comments?: any[];
  user?: { alias: string };
}

// 投稿リストコンポーネントのProps定義: 投稿データの配列と掲示板名を受け取る
interface Props {
  posts: Post[];
  boardName: string;
}

/**
 * 投稿リストコンポーネント
 * 投稿のタイトル、投稿者、作成日時、いいね数、閲覧数などを一覧表示し、
 * 各項目をクリックすると該当する投稿の詳細ページへ遷移する。
 */
const BoardPostList: React.FC<Props> = ({ posts, boardName }) => {

  // 投稿詳細ページへの遷移処理: 投稿IDを元にURLを生成して遷移
  const goPost = (postId: number) => {
    window.location.href = `/board/${boardName}/post/${postId}`;
  };

  return ( 
    <div className="space-y-3">

      {posts.map((post) => (
        <div
          key={post.postId}
          className="border p-3 rounded hover:shadow cursor-pointer"
        >

          {/* タイトルエリア */}
          <div
            onClick={() => goPost(post.postId)}
            className="font-semibold text-gray-800"
          >
            {post.title} 

            {/* コメント数表示 (存在する場合のみ) */}
            {post.comments?.length ? (
              <span className="text-red-500 ml-2">
                [{post.comments.length}]
              </span>
            ) : null}
          </div>

          {/* メタ情報エリア (投稿者、閲覧数、評価、日付) */}
          <div className="text-xs text-gray-500 mt-1 flex gap-2">
            <span>{post.user?.alias ?? "匿名"}</span>
            <span>👁 {post.views}</span>
            <span>👍 {post.likes - post.dislikes}</span>
            <span>
              {new Date(post.createdAt).toISOString().slice(0, 10)}
            </span>
          </div>

        </div>
      ))}

    </div>
  );
};

export default BoardPostList;
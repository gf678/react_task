import React from "react";
import { useTranslation } from "react-i18next";

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

interface Props {
  posts: Post[];
  boardName: string;
}

const BoardPostList: React.FC<Props> = ({ posts, boardName }) => {
  const { t } = useTranslation();

  const goPost = (postId: number) => {
    window.location.href = `/board/${boardName}/post/${postId}`;
  };

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.postId}
          className="cursor-pointer rounded border p-3 hover:shadow"
        >
          <div
            onClick={() => goPost(post.postId)}
            className="font-semibold text-gray-800"
          >
            {post.title}

            {post.comments?.length ? (
              <span className="ml-2 text-red-500">
                [{post.comments.length}]
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex gap-2 text-xs text-gray-500">
            <span>
              {post.user?.alias ?? t("common.anonymous")}
            </span>

            <span>
              👁 {post.views}
            </span>

            <span>
              👍 {post.likes - post.dislikes}
            </span>

            <span>
              {new Date(post.createdAt)
                .toISOString()
                .slice(0, 10)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardPostList;
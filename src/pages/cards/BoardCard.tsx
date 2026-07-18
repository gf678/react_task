import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Post } from "../../types/post";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";

interface Props {
  boardId: number;
  boardTitle: string;
  posts: Post[];
  isProtected: boolean;
}

const ACCESS_DURATION = 60 * 60 * 1000;

const hasValidAccess = (key: string) => {
  const value = sessionStorage.getItem(key);

  if (!value) return false;

  try {
    const parsed = JSON.parse(value);

    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(key);
      return false;
    }

    return true;
  } catch {
    sessionStorage.removeItem(key);
    return false;
  }
};

const saveBoardAccess = (boardId: number, boardTitle: string) => {
  const expiresAt = Date.now() + ACCESS_DURATION;
  const value = JSON.stringify({ expiresAt });

  sessionStorage.setItem(`board-access-${boardId}`, value);
  sessionStorage.setItem(`board-access-${boardTitle}`, value);
};

const BoardCard: React.FC<Props> = ({
  boardId,
  boardTitle,
  posts,
  isProtected,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const encodedBoardTitle = encodeURIComponent(boardTitle);
  const listPath = `/board/${encodedBoardTitle}/list`;

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState(listPath);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasBoardAccess = () =>
    hasValidAccess(`board-access-${boardId}`) ||
    hasValidAccess(`board-access-${boardTitle}`);

  const formatDate = (date?: string) => {
    if (!date) return "";

    const d = new Date(date);

    return `${(d.getMonth() + 1).toString().padStart(2, "0")}.${d
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  };

  const openProtectedPath = (path: string) => {
    if (!isProtected) {
      navigate(path);
      return;
    }

    if (hasBoardAccess()) {
      navigate(path);
      return;
    }

    setNextPath(path);
    setShowPassword(true);
  };

  const openBoard = () => {
    openProtectedPath(listPath);
  };

  const checkPassword = async () => {
    try {
      setIsSubmitting(true);

      await api.post(`/api/boards/${boardId}/access`, {
        password,
      });

      saveBoardAccess(boardId, boardTitle);

      setShowPassword(false);
      setPassword("");

      navigate(nextPath);
    } catch (err) {
      console.error(err);
      alert("비밀번호가 틀렸습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={openBoard}
            className="truncate text-lg font-semibold text-gray-900 transition hover:text-pink-600"
          >
            {boardTitle}
            {isProtected && <span className="ml-2">🔒</span>}
          </button>

          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
            {posts.length} {t("boardCard.posts")}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-gray-100">
        {posts.length > 0 ? (
          posts.slice(0, 5).map((post) => {
            const postPath = `/board/${encodedBoardTitle}/post/${post.postId}`;

            return (
              <li key={post.postId}>
                <Link
                  to={postPath}
                  onClick={(event) => {
                    if (isProtected && !hasBoardAccess()) {
                      event.preventDefault();
                      setNextPath(postPath);
                      setShowPassword(true);
                    }
                  }}
                  className="block px-5 py-4 transition hover:bg-pink-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-800">
                        {post.title}

                        {post.comments?.length ? (
                          <span className="ml-2 text-red-500">
                            [{post.comments.length}]
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>
                          {post.user?.alias ?? t("boardCard.anonymous")}
                        </span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        👍 {post.likes - post.dislikes}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        👁 {post.views}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })
        ) : (
          <li className="px-5 py-10 text-center text-sm text-gray-400">
            <button
              type="button"
              onClick={openBoard}
              className="transition hover:text-pink-500"
            >
              {t("boardCard.firstPost")}
            </button>
          </li>
        )}
      </ul>

      <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3">
        <button
          type="button"
          onClick={openBoard}
          className="text-sm font-medium text-gray-600 transition hover:text-pink-600"
        >
          {t("boardCard.more")}
        </button>
      </div>

      {showPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void checkPassword();
            }}
            className="rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 font-semibold">🔒 Password</h3>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mb-4 rounded-xl border px-3 py-2"
              placeholder="Password"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-pink-500 px-4 py-2 text-white disabled:opacity-60"
              >
                확인
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPassword(false);
                  setPassword("");
                  setNextPath(listPath);
                }}
                className="rounded-xl bg-gray-100 px-4 py-2"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BoardCard;

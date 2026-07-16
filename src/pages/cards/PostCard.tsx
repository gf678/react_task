import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  postId: number;
  title: string;
  writer: string;
  comment: number;
  boardname: string;
  thumbs: number;
  views: number;
}

const PostCard: React.FC<Props> = ({
  postId,
  title,
  writer,
  comment,
  boardname,
  thumbs,
  views
}) => {
  const { t } = useTranslation();

  const safeBoard = boardname || t("postCard.unknownBoard");

  return (
    <Link
      to={`/board/${encodeURIComponent(safeBoard)}/post/${postId}`}
      className="block"
    >
      <div className="h-full rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-100 hover:shadow-md">

        <div className="mb-4 flex items-start justify-between gap-3">

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-6 text-gray-900">

              {title}

              {comment > 0 && (
                <span className="ml-1 text-red-500">
                  [{comment}]
                </span>
              )}

            </h3>
          </div>

          <span className="shrink-0 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-600">
            {safeBoard}
          </span>

        </div>


        <div className="flex items-center justify-between gap-3">

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-700">
              {writer}
            </p>
          </div>


          <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">

            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              👍 {thumbs}
            </span>

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
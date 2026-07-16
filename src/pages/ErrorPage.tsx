import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type ErrorConfig = {
  label: string;
  title: string;
  description: string;
  helper: string;
  accent: string;
  iconBg: string;
  iconRing: string;
};

// ステータスコードに応じて、画面の文言とカラーテーマを切り替える
const statusConfig: Record<number, ErrorConfig> = {
  400: {
    label: "BadRequest",
    title: "InvalidRequestTitle",
    description: "InvalidRequestDescription",
    helper: "InvalidRequestHelper",
    accent: "text-amber-600",
    iconBg: "bg-amber-50",
    iconRing: "ring-amber-100",
  },
  403: {
    label: "Forbidden",
    title: "ForbiddenTitle",
    description: "ForbiddenDescription",
    helper: "ForbiddenHelper",
    accent: "text-orange-600",
    iconBg: "bg-orange-50",
    iconRing: "ring-orange-100",
  },
  404: {
    label: "NotFound",
    title: "NotFoundTitle",
    description: "NotFoundDescription",
    helper: "NotFoundHelper",
    accent: "text-pink-600",
    iconBg: "bg-pink-50",
    iconRing: "ring-pink-100",
  },
  408: {
    label: "Timeout",
    title: "TimeoutTitle",
    description: "TimeoutDescription",
    helper: "TimeoutHelper",
    accent: "text-sky-600",
    iconBg: "bg-sky-50",
    iconRing: "ring-sky-100",
  },
  410: {
    label: "Gone",
    title: "GoneTitle",
    description: "GoneDescription",
    helper: "GoneHelper",
    accent: "text-violet-600",
    iconBg: "bg-violet-50",
    iconRing: "ring-violet-100",
  },
  500: {
    label: "ServerError",
    title: "ServerErrorTitle",
    description: "ServerErrorDescription",
    helper: "ServerErrorHelper",
    accent: "text-rose-600",
    iconBg: "bg-rose-50",
    iconRing: "ring-rose-100",
  },
};

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useTranslation();

  // エラーページはクエリ文字列（query string）からstatus/messageを受け取り、状況別に表示する
  const params = new URLSearchParams(location.search);
  const rawStatus = Number(params.get("status"));
  const status = Number.isFinite(rawStatus) && rawStatus > 0 ? rawStatus : 404;
  const message = params.get("message") || "";

  // 定義されていないステータスコードは、基本的に500の画面スタイルを使用する
  const current = statusConfig[status] ?? statusConfig[500];

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-white/70 bg-white/90 px-6 py-7 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${current.accent}`}
              >
                {t(current.label)}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                {t(current.title)}
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {t(current.description)}
              </p>
            </div>

            {/* 右側のサマリーカードで、現在のステータスコードとパスを素早く表示する */}
            <div className="flex gap-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <p className="text-xs text-gray-500">Status</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {t("Status")}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <p className="text-xs text-gray-500">Path</p>
                <p className="mt-1 max-w-[180px] truncate text-sm font-semibold text-gray-900">
                  {t("Path")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ring-1 ${current.iconBg} ${current.iconRing}`}
              >
                ⚠️
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("CannotLoadPage")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {t(current.helper)}
                </p>

                {/* サーバーから詳細なメッセージが渡された場合、追加の案内ボックスを表示する */}
                {message && (
                  <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* ユーザーがすぐに復帰できるよう、ホーム移動と戻るアクションを配置する */}
            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/")}
                className="flex-1 rounded-2xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-600"
              >
                {t("GoHome")}
              </button>

              <button
                onClick={() => window.history.back()}
                className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {t("GoBack")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ErrorPage;
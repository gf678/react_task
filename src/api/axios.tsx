import axios, { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { store } from "../store";
import { setAccessToken, logout } from "../store/authSlice";

// Axios インスタンスとインターセプターの設定
type RetryableRequestConfig = InternalAxiosRequestConfig & { // _retry フラグを追加
  _retry?: boolean;
};

// 1. BASE_URL 設定 (環境に応じて変更)
const BASE_URL = import.meta.env.DEV ? "http://localhost:3003" : "";

// 2. Axios インスタンス生成
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// 3. リフレッシュ専用 Axios インスタンス (インターセプターなし)
const refreshApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// 4. インターセプター除外判定
const shouldSkipRefresh = (url = "") =>
  url.includes("/api/auth/login") ||
  url.includes("/api/auth/signup") ||
  url.includes("/api/auth/logout") ||
  url.includes("/api/auth/refresh");

// 5. 認証ヘッダー設定関数
const setAuthHeader = (config: RetryableRequestConfig, token: string) => {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;
};

// 6. トークン更新ロジックと保留中のリクエスト管理
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

// 7. 保留中のリクエストを解決
const resolvePendingRequests = (token: string) => {
  pendingRequests.forEach(({ resolve }) => resolve(token));
  pendingRequests = [];
};

// 8. エラー発生時に保留中のすべてのリクエストを拒否
const rejectPendingRequests = (error: unknown) => {
  pendingRequests.forEach(({ reject }) => reject(error));
  pendingRequests = [];
};

api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;

  if (token) {
    setAuthHeader(config as RetryableRequestConfig, token);
  }

  return config;
});

// 9. レスポンスインターセプター: 401エラーおよびその他のエラー処理
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";

    // 1. インターセプター除外URL (ログイン、会員登録、ログアウト、トークン更新) → グローバルエラー処理へ
    if (!original || shouldSkipRefresh(url)) {
      handleGlobalError(error);
      return Promise.reject(error);
    }

    // 2. 401 エラー → トークン更新を試行 (二重リクエスト防止)
    if (status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((newToken) => {
          setAuthHeader(original, newToken);
          return api(original);
        });
      }

      isRefreshing = true;

      try {
        // 🔥 トークン更新の試行
        const response = await refreshApi.post("/api/auth/refresh");
        const newToken = response.data?.accessToken;
        
        if (!newToken) {
          throw new Error("NO_NEW_ACCESS_TOKEN");
        }

        store.dispatch(setAccessToken(newToken));
        resolvePendingRequests(newToken);

        setAuthHeader(original, newToken);
        return api(original);
      } catch (refreshError) {
        rejectPendingRequests(refreshError);
        store.dispatch(logout());

        // 🔥 401 最終失敗 → ログインまたはエラーページへ
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 🔥 3. その他のエラー (400, 403, 404, 500 など)
    handleGlobalError(error);

    return Promise.reject(error);
  }
);

// 10. グローバルエラー処理関数 (401はここでは処理しない)
const handleGlobalError = (error: AxiosError) => {
  const status = error.response?.status;
  const message = error.response?.data as any;

  if (!status) return;

  // ❗ 401は上記で処理済みのため除外
  if (status === 401) return;

  // ❗ すでにエラーページにいる場合は重複移動を防止
  if (window.location.pathname.startsWith("/error")) return;

  const msg =
    typeof message === "string"
      ? message
      : message?.message ?? "Unknown error";

  window.location.href = `/error?status=${status}&msg=${encodeURIComponent(msg)}`;
};

export default api;
import axios from "axios";
import { store } from "../store";
import { setAccessToken, logout } from "../store/authSlice";

// ページ初期ロード時のトークン更新試行関数
export const bootAuth = async () => {
  try {
    // 🔥 ページ初期ロード時にトークンの再発行を試行
    const res = await axios.post(
      "http://localhost:3003/auth/refresh",
      {},
      { withCredentials: true }
    );

    store.dispatch(setAccessToken(res.data.accessToken));
  } catch {
    // トークンの更新に失敗した場合（例：期限切れ、無効など） → ログアウト処理
    store.dispatch(logout());
  }
};
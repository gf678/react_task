// プロフィール画像がない場合に共通で使用するデフォルト画像のパス
export const DEFAULT_PROFILE_IMG = "/img/default_profile.png";

// ローカル開発環境とデプロイ環境で画像の絶対パスを使い分ける
const API_ORIGIN =
  window.location.hostname === "localhost"
    ? "http://localhost:3003"
    : "http://deer2922.ddns.net:3003";

export const normalizeProfileImg = (value?: string | null) => {
  // 値がない場合はデフォルトのプロフィール画像を返す
  if (!value) {
    return DEFAULT_PROFILE_IMG;
  }

  // data URLや、すでに完全な絶対URLである場合はそのまま使用する
  if (
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  // サーバーから相対パスが返された場合、ブラウザで正しく表示できるよう API origin を付与して絶対パスにする
  return `${API_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
};
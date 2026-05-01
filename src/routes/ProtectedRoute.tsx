import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../store";
import type { JSX } from "react";

interface Props {
  children: JSX.Element;
}

/**
 * ログイン認証が必要なルートを保護するコンポーネント
 */
const ProtectedRoute = ({ children }: Props) => {
  // Reduxストアから現在のログイン状態を取得
  const isLogin = useSelector((state: RootState) => state.auth.isLogin);

  // 1. ログインしていないユーザーはログインページへリダイレクト
  if (!isLogin) {
    return <Navigate to="/login" replace />;
  }

  // 2. ログイン済みの場合は、そのまま指定されたコンポーネント（子要素）を表示
  return children;
};

export default ProtectedRoute;
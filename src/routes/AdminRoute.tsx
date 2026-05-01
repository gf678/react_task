import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { Navigate } from "react-router-dom";
import type { JSX } from "react";

/**
 * 管理者権限を持つユーザーのみがアクセス可能なルートを保護するコンポーネント
 */
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  // Reduxストアから現在のログイン状態とユーザー情報を取得
  const { user, isLogin } = useSelector((state: RootState) => state.auth);

  // 1. ログインしていない場合はログインページへリダイレクト
  if (!isLogin) {
    return <Navigate to="/login" replace />;
  }

  // 2. ログイン済みであっても、権限が 'ADMIN' でない場合はホームへリダイレクト
  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  // 3. ログイン済みかつ管理者権限が確認できた場合のみ、子コンポーネント（保護されたページ）を表示
  return children;
};

export default AdminRoute;
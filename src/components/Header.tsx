// src/components/Header.tsx
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { logout, setUser } from "../store/authSlice";
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { normalizeProfileImg } from "../utils/profileImage";

// 掲示板情報の型定義
interface Board {
  id: number;
  name: string;
}
// メニューパネルに共通で適用するクラス
const menuPanelClass =
  "absolute top-[calc(100%+12px)] rounded-2xl border border-white/70 bg-white/95 p-2 shadow-lg backdrop-blur-xl z-50";

// ヘッダーコンポーネント
const Header = () => {
  // Reduxからログイン状態とユーザー情報を取得
  const { isLogin, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  // ローカルステート: 掲示板一覧、お気に入り、検索ワード、検索結果、開いているメニュー
  const [boards, setBoards] = useState<Board[]>([]);
  const [favorites, setFavorites] = useState<Board[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Board[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ユーザー情報の同期関数
  const syncMe = useCallback(async () => {
    // ログイン状態でなければ同期不要
    if (!isLogin) return;

    // APIを呼び出してユーザー情報を取得
    try {
      // 🔥 ユーザー情報の同期を試行
      const res = await api.get("/api/user/me");
      const me = res.data?.user ?? res.data;
      dispatch(setUser(me));
    } catch (err: any) {
      // 401エラーの場合 → トークンが無効 → ログアウト処理
      if (err?.response?.status === 401) {
        dispatch(logout());
        setFavorites([]);
      } else {
        // その他のエラーはグローバルエラーとして処理（ネットワークエラー、サーバーエラーなど）
        console.error("header getMe failed", err);
      }
    }
  }, [dispatch, isLogin]);

  // 購読情報の同期関数
  const syncFavorites = useCallback(async () => {
    // ログイン状態でなければ同期不要
    if (!isLogin) return;

    // APIを呼び出して購読情報を取得
    try {
      const res = await api.get("/api/subscription");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? res.data ?? [];

      setFavorites(data);
    } catch (err) {
      // グローバルエラー処理
      console.error("favorites sync failed", err);
    }
  }, [isLogin]);
  
  // 掲示板一覧とお気に入り一覧を初期ロード時およびログイン状態変更時に同期
  useEffect(() => {
    // 掲示板一覧はログインの有無に関わらず常に同期
    api.get("/api/boards").then((res) => {
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? res.data?.boards ?? [];

      setBoards(data);
    });
  }, []);

  // お気に入り一覧はログイン状態に応じて同期または初期化
  useEffect(() => {
    if (!isLogin) {
      setFavorites([]);
      return;
    }
    // お気に入り一覧APIの呼び出し
    api.get("/api/subscription").then((res) => {
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? res.data ?? [];

      setFavorites(data);
    });
  }, [isLogin, location.pathname]);

  // 1. ログイン状態の変更やページがアクティブになった際にユーザー情報とお気に入りを同期
  useEffect(() => {
    if (!isLogin) return;

    // ページがアクティブになるたびに同期を試行 (フォーカス、タブ切り替えなど)
    void syncMe();
    void syncFavorites(); 

    // フォーカスイベントハンドラー
    const handleFocus = () => {
      void syncMe();
      void syncFavorites(); 
    };

    // 可視性状態の変更イベントハンドラー (タブ切り替えなど)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncMe();
        void syncFavorites(); 
      }
    };

    // イベントリスナーの登録
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // クリーンアップ
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLogin, location.pathname, syncMe, syncFavorites]);

  // 2. 購読変更イベント発生時にお気に入りを同期 (例: 購読の追加/解除)
  useEffect(() => {
    const refetch = () => {
      void syncFavorites();
    };
    // カスタムイベントリスナーの登録
    window.addEventListener("subscriptionChanged", refetch);

    return () => {
      window.removeEventListener("subscriptionChanged", refetch);
    };
  }, [syncFavorites]);

  // 3. パスが変更されるたびに開いているメニューを閉じる
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  // 検索ワードまたは掲示板一覧が変更されるたびに結果をフィルタリング
  useEffect(() => {
    if (!search.trim()) {
      setFiltered([]);
      return;
    }
    setFiltered(
      boards.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, boards]);

  // メニュートグル関数: 同じメニューなら閉じ、違うメニューなら切り替え
  const toggle = (menu: string) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  // ログアウト処理: API呼び出し後、成功の成否に関わらずクライアントの状態を初期化
  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("logout failed", err);
    } finally {
      dispatch(logout());
      setFavorites([]);
      setOpenMenu(null);
    }
  };

  // レンダリング: ヘッダー構造、メニューパネル、検索、プロフィールメニューなど
  return (
    <header className="sticky top-0 z-50 px-4 py-4">
      <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-3xl border border-white/70 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-xl">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-pink-50"
        >
          <img
            src="/icon_page.png"
            className="h-10 w-10 rounded-2xl object-cover"
            alt="logo"
          />
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
              PLUG
            </p>
            <p className="text-sm font-semibold text-gray-900">Connect Better</p>
          </div>
        </Link>

        <div className="ml-2 hidden items-center gap-2 lg:flex">
          <div className="relative">
            <button
              onClick={() => toggle("all")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                openMenu === "all"
                  ? "bg-pink-100 text-pink-600"
                  : "text-gray-700 hover:bg-pink-50 hover:text-pink-600"
              }`}
            >
              全体チャンネル
            </button>

            {openMenu === "all" && (
              <div className={`${menuPanelClass} left-0 w-56`}>
                {boards.length > 0 ? (
                  boards.map((board) => (
                    <Link
                      key={board.id}
                      to={`/board/${board.name}/list`}
                      className="block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-pink-50 hover:text-pink-600"
                    >
                      {board.name}
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-gray-400">
                    チャンネルがありません。
                  </div>
                )}
              </div>
            )}
          </div>

          {isLogin && (
            <div className="relative">
              <button
                onClick={() => toggle("fav")}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  openMenu === "fav"
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                お気に入り
              </button>

              {openMenu === "fav" && (
                <div className={`${menuPanelClass} left-0 w-56`}>
                  {favorites.length > 0 ? (
                    favorites.map((board) => (
                      <Link
                        key={board.id}
                        to={`/board/${board.name}/list`}
                        className="block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        {board.name}
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-gray-400">
                      購読中のチャンネルはありません。
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative ml-auto w-full max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="チャンネル検索"
            className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
          />

          {filtered.length > 0 && (
            <div className={`${menuPanelClass} left-0 right-0`}>
              {filtered.map((board) => (
                <Link
                  key={board.id}
                  to={`/board/${board.name}/list`}
                  className="block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-pink-50 hover:text-pink-600"
                >
                  {board.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="relative shrink-0">
          {isLogin ? (
            <>
              <button
                onClick={() => toggle("profile")}
                className={`flex items-center gap-3 rounded-2xl px-2 py-1.5 transition ${
                  openMenu === "profile"
                    ? "bg-pink-50"
                    : "hover:bg-pink-50"
                }`}
              >
                <img
                  src={normalizeProfileImg(user?.profileImg)}
                  className="h-10 w-10 rounded-full border border-white/70 object-cover shadow-sm"
                  alt="profile"
                />

                <div className="hidden text-left md:block">
                  <p className="max-w-[120px] truncate text-sm font-semibold text-gray-900">
                    {user?.alias}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === "ADMIN" ? "Administrator" : "Member"}
                  </p>
                </div>
              </button>
              {openMenu === "profile" && (
                <div className={`${menuPanelClass} right-0 w-64`}>
                  <div className="rounded-2xl bg-gradient-to-r from-pink-50 to-indigo-50 px-4 py-4">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {user?.alias}
                    </p>
                  </div>

                  <div className="mt-2 space-y-1">
                    {user?.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                      >
                        管理者ページ
                      </Link>
                    )}

                    <Link
                      to="/user/edit"
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-pink-50 hover:text-pink-600"
                    >
                      マイ情報
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-500"
                    >
                      ログアウト
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../store/authSlice";
import api from "../api/axios";

// "findpw" モードを型定義に追加
type Mode = "signin" | "signup" | "findpw";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState("");
  // パスワード再設定メール送信後の完了メッセージ用
  const [successMsg, setSuccessMsg] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isSignup = mode === "signup";
  const isFindPw = mode === "findpw";

  // 会員登録処理
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      alias: formData.get("alias"),
      loginId: formData.get("loginId"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      await api.post("/api/auth/signup", payload);
      alert("会員登録完了！");
      setMode("signin");
      setError("");
    } catch (err: any) {
      alert(err.response?.data?.message || "登録失敗");
    }
  };

  // ログイン処理
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const loginId = formData.get("loginId") as string;
    const password = formData.get("password") as string;

    try {
      const res = await api.post("/api/auth/login", { loginId, password });
      dispatch(setAuth({ accessToken: res.data.accessToken, user: res.data.user }));
      navigate("/", { replace: true });
    } catch {
      setError("ログインに失敗しました。IDまたはパスワードを確認してください。");
    }
  };

  /**
   * パスワード再設定メール送信処理
   */
  const handleFindPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      // バックエンドのパスワードリセットAPIを呼び出す想定
      await api.post("/api/auth/find-password", { email });
      setSuccessMsg("パスワード再設定用のリンクをメールで送信しました。");
    } catch (err: any) {
      setError(err.response?.data?.message || "メール送信に失敗しました。");
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto grid min-h-[720px] max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-sm backdrop-blur-xl lg:grid-cols-2">
        
        {/* 左側：ブランド・紹介エリア */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-pink-100 via-rose-50 to-indigo-100 p-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_35%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">Board Hub</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-gray-900">
                コミュニティを<br />もっと快適に
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-gray-600">
                掲示板、コメント、お気に入り、プロフィール管理を一つの場所で自然につなげるコミュニティ空間です。
              </p>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur">
              {isSignup ? (
                <>
                  <p className="text-sm font-medium text-gray-500">すでにアカウントをお持ちですか？</p>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">再ログインして続けてご利用ください</h2>
                  <button onClick={() => setMode("signin")} className="mt-5 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black">
                    ログイン
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-500">初めてですか？</p>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">新しいアカウントを作成してすぐに始めましょう</h2>
                  <button onClick={() => setMode("signup")} className="mt-5 rounded-2xl bg-pink-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-pink-600">
                    登録
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 右側：フォームエリア */}
        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            
            {/* モバイル用タイトル */}
            <div className="mb-8 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">Board Hub</p>
              <h1 className="mt-3 text-3xl font-bold text-gray-900">
                {isSignup ? "アカウント作成" : isFindPw ? "パスワード再設定" : "ログイン"}
              </h1>
            </div>

            {/* モード切替タブ (findpwの時は非表示) */}
            {!isFindPw && (
              <div className="mb-6 flex rounded-2xl bg-gray-100 p-1">
                <button type="button" onClick={() => {setMode("signin"); setError("");}} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${!isSignup ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  ログイン
                </button>
                <button type="button" onClick={() => {setMode("signup"); setError("");}} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${isSignup ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  登録
                </button>
              </div>
            )}

            {/* --- 1. ログインフォーム --- */}
            {mode === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">ID</label>
                  <input name="loginId" className={inputClass} placeholder="IDを入力" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">パスワード</label>
                  <input name="password" type="password" className={inputClass} placeholder="パスワードを入力" required />
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => {setMode("findpw"); setError("");}} className="text-xs font-medium text-gray-400 hover:text-pink-500">
                    パスワードをお忘れですか？
                  </button>
                </div>
                {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-500">{error}</div>}
                <button className="w-full rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black">ログイン</button>
              </form>
            )}

            {/* --- 2. 会員登録フォーム --- */}
            {mode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">ニックネーム</label>
                  <input name="alias" className={inputClass} placeholder="ニックネーム" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">ID</label>
                  <input name="loginId" className={inputClass} placeholder="ID" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">メール</label>
                  <input name="email" type="email" className={inputClass} placeholder="example@mail.com" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">パスワード</label>
                  <input name="password" type="password" className={inputClass} placeholder="パスワード" required />
                </div>
                <button className="w-full rounded-2xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-600">登録</button>
              </form>
            )}

            {/* --- 3. パスワード再設定フォーム --- */}
            {mode === "findpw" && (
              <form onSubmit={handleFindPassword} className="space-y-5">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">パスワード再設定</h2>
                  <p className="mt-2 text-sm text-gray-500">ご登録いただいたメールアドレスを入力してください。再設定用のリンクをお送りします。</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">メールアドレス</label>
                  <input name="email" type="email" className={inputClass} placeholder="example@mail.com" required />
                </div>
                {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-500">{error}</div>}
                {successMsg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{successMsg}</div>}
                <button className="w-full rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black">メールを送信</button>
                <button type="button" onClick={() => {setMode("signin"); setSuccessMsg(""); setError("");}} className="w-full text-sm font-medium text-gray-500 hover:text-gray-700">
                  ログイン画面に戻る
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
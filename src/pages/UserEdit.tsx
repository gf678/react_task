import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setUser, updateUser } from "../store/authSlice";
import type { RootState } from "../store";

const DEFAULT_PROFILE = "/img/default_profile.png";

const API_ORIGIN =
  window.location.hostname === "localhost"
    ? "http://localhost:3003"
    : "http://deer2922.ddns.net:3003";

/**
 * サーバーから取得した画像パスを正規化する
 * 相対パス、絶対パス、データURI、デフォルト画像を適切に処理する
 */
const normalizeProfileImg = (value?: string | null) => {
  if (!value) return DEFAULT_PROFILE;

  if (value === DEFAULT_PROFILE || value.startsWith("/img/")) {
    return value;
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `${API_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
};

type UserSnapshot = {
  alias?: string | null;
  email?: string | null;
  phone?: string | null;
  profileImg?: string | null;
};

const UserEdit = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [form, setForm] = useState({
    alias: "",
    email: "",
    phone: "",
    password: "",
  });

  const [preview, setPreview] = useState(DEFAULT_PROFILE);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [removeProfileImg, setRemoveProfileImg] = useState(false);

  // 初回データと比較して変更の有無を判断するための基準値
  const originalRef = useRef<{
    alias: string;
    email: string;
    phone: string;
    profileImg: string;
  } | null>(null);

  // 編集中にReduxへ一時反映した値を、キャンセル（離脱）時に戻すための元データ
  const reduxOriginRef = useRef({
    alias: currentUser?.alias ?? "",
    profileImg: normalizeProfileImg(currentUser?.profileImg),
  });

  const draftAppliedRef = useRef(false);

  /**
   * ヘッダーなどの他UIに即時反映させるため、Reduxの状態を一時的に更新する
   */
  const applyDraftToRedux = (nextAlias: string, nextProfileImg: string) => {
    draftAppliedRef.current = true;

    dispatch(
      updateUser({
        alias: nextAlias,
        profileImg: nextProfileImg,
      }),
    );
  };

  /**
   * ユーザー情報をフォーム、プレビュー、比較基準値に一括反映する
   */
  const applyUserSnapshot = (rawUser: UserSnapshot | null | undefined) => {
    if (!rawUser) return;

    const nextAlias = rawUser.alias ?? "";
    const nextEmail = rawUser.email ?? "";
    const nextPhone = rawUser.phone ?? "";
    const nextProfileImg = normalizeProfileImg(rawUser.profileImg);

    setForm({
      alias: nextAlias,
      email: nextEmail,
      phone: nextPhone,
      password: "",
    });

    setPreview(nextProfileImg);
    setFile(null);
    setRemoveProfileImg(false);

    originalRef.current = {
      alias: nextAlias,
      email: nextEmail,
      phone: nextPhone,
      profileImg: nextProfileImg,
    };

    reduxOriginRef.current = {
      alias: nextAlias,
      profileImg: nextProfileImg,
    };
  };

  /**
   * サーバーから最新のユーザー情報を取得し、Reduxと同期する
   */
  const syncUserFromServer = async () => {
    const res = await api.get("/api/user/me");
    if (!res.data) return;
    
    const latest = res.data?.user ?? res.data;
    applyUserSnapshot(latest);
    dispatch(setUser(latest));

    return latest;
  };

  // 初期化：最新のユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setInitializing(true);
        await syncUserFromServer();
      } catch (err) {
        console.error("ユーザー情報の取得に失敗しました", err);
      } finally {
        setInitializing(false);
      }
    };

    void fetchUser();
  }, [dispatch]);

  // クリーンアップ：保存せずに離脱した場合、Reduxの状態を元に戻す
  useEffect(() => {
    return () => {
      if (draftAppliedRef.current) {
        dispatch(
          updateUser({
            alias: reduxOriginRef.current.alias,
            profileImg: reduxOriginRef.current.profileImg,
          }),
        );
      }
    };
  }, [dispatch]);

  /**
   * 画像選択時の処理：プレビュー表示とReduxへの一時反映
   */
  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setRemoveProfileImg(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const nextPreview = ev.target?.result as string;
      setPreview(nextPreview);
      applyDraftToRedux(form.alias, nextPreview);
    };
    reader.readAsDataURL(selectedFile);
  };

  /**
   * プロフィール画像をデフォルトに戻す
   */
  const setImageToDefault = () => {
    setFile(null);
    setRemoveProfileImg(true);
    setPreview(DEFAULT_PROFILE);
    applyDraftToRedux(form.alias, "");
  };

  /**
   * フォーム送信処理
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const original = originalRef.current;
    if (!original) return;

    // 変更があるかチェック
    const shouldRemoveProfileImg =
      removeProfileImg && original.profileImg !== DEFAULT_PROFILE;

    const isChanged =
      form.alias !== original.alias ||
      form.email !== original.email ||
      form.phone !== original.phone ||
      form.password.trim() !== "" ||
      file !== null ||
      shouldRemoveProfileImg ||
      preview !== original.profileImg;

    if (!isChanged) {
      alert("変更された項目がありません。");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("alias", form.alias.trim());
      fd.append("email", form.email.trim());
      fd.append("phone", form.phone.trim());

      if (form.password.trim()) {
        fd.append("password", form.password.trim());
      }

      if (file) {
        fd.append("imageFile", file);
      }

      if (shouldRemoveProfileImg) {
        fd.append("removeProfileImg", "true");
      }

      await api.post("/api/user/edit", fd);
      await syncUserFromServer();

      draftAppliedRef.current = false;
      alert("情報を更新しました。");
    } catch (err) {
      console.error("更新に失敗しました", err);
      alert("情報の更新に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/70 bg-white/90 p-10 text-center text-gray-400 shadow-sm backdrop-blur">
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            マイプロフィール
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            ニックネーム、プロフィール画像、連絡先情報を変更できます。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          {/* 左側：プレビューカード */}
          <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col items-center text-center">
              <img
                src={preview}
                alt="プロフィールプレビュー"
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow"
              />

              <div className="mt-4">
                <p className="text-lg font-semibold text-gray-900">
                  {form.alias || "ニックネーム未設定"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {form.email || "メールアドレス未登録"}
                </p>
              </div>

              <label className="mt-5 inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
                画像を変更
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />
              </label>

              {file && (
                <p className="mt-3 max-w-full break-all text-xs text-gray-500">
                  {file.name}
                </p>
              )}

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={setImageToDefault}
                  disabled={loading}
                  className="text-sm text-pink-500 hover:text-pink-600 disabled:opacity-50"
                >
                  デフォルト画像に戻す
                </button>
              </div>
            </div>
          </div>

          {/* 右側：編集フォーム */}
          <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ニックネーム
                </label>
                <input
                  value={form.alias}
                  onChange={(e) => {
                    const nextAlias = e.target.value;
                    setForm((prev) => ({ ...prev, alias: nextAlias }));
                    applyDraftToRedux(nextAlias, preview);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  placeholder="ニックネームを入力"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  placeholder="変更する場合のみ入力してください"
                />
                <p className="mt-2 text-xs text-gray-400">
                  ※変更しない場合は空欄のままにしてください。
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  placeholder="example@mail.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  placeholder="090-1234-5678"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "保存中..." : "変更を保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEdit;
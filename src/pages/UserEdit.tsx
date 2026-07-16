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
import { useTranslation } from "react-i18next";

const DEFAULT_PROFILE = "/img/default_profile.png";

const API_ORIGIN =
  window.location.hostname === "localhost"
    ? "http://localhost:3003"
    : "http://deer2922.ddns.net:3003";

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
  const { t } = useTranslation();

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

  const originalRef = useRef<{
    alias: string;
    email: string;
    phone: string;
    profileImg: string;
  } | null>(null);

  const reduxOriginRef = useRef({
    alias: currentUser?.alias ?? "",
    profileImg: normalizeProfileImg(currentUser?.profileImg),
  });

  const draftAppliedRef = useRef(false);

  const applyDraftToRedux = (
    nextAlias: string,
    nextProfileImg: string,
  ) => {
    draftAppliedRef.current = true;

    dispatch(
      updateUser({
        alias: nextAlias,
        profileImg: nextProfileImg,
      }),
    );
  };

  const applyUserSnapshot = (
    rawUser: UserSnapshot | null | undefined,
  ) => {
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

  const syncUserFromServer = async () => {
    const res = await api.get("/api/user/me");

    if (!res.data) return;

    const latest = res.data?.user ?? res.data;

    applyUserSnapshot(latest);
    dispatch(setUser(latest));

    return latest;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setInitializing(true);
        await syncUserFromServer();
      } catch (err) {
        console.error(
          "ユーザー情報取得エラー",
          err,
        );
      } finally {
        setInitializing(false);
      }
    };

    void fetchUser();
  }, [dispatch]);

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

  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setRemoveProfileImg(false);

    const reader = new FileReader();

    reader.onload = (ev) => {
      const nextPreview =
        ev.target?.result as string;

      setPreview(nextPreview);

      applyDraftToRedux(
        form.alias,
        nextPreview,
      );
    };

    reader.readAsDataURL(selectedFile);
  };

  const setImageToDefault = () => {
    setFile(null);
    setRemoveProfileImg(true);
    setPreview(DEFAULT_PROFILE);

    applyDraftToRedux(
      form.alias,
      "",
    );
  };

  const handleSubmit = async (
    e: FormEvent,
  ) => {
    e.preventDefault();

    const original = originalRef.current;

    if (!original) return;

    const shouldRemoveProfileImg =
      removeProfileImg &&
      original.profileImg !== DEFAULT_PROFILE;

    const isChanged =
      form.alias !== original.alias ||
      form.email !== original.email ||
      form.phone !== original.phone ||
      form.password.trim() !== "" ||
      file !== null ||
      shouldRemoveProfileImg ||
      preview !== original.profileImg;

    if (!isChanged) {
      alert(t("profile.noChanges"));
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();

      fd.append(
        "alias",
        form.alias.trim(),
      );

      fd.append(
        "email",
        form.email.trim(),
      );

      fd.append(
        "phone",
        form.phone.trim(),
      );

      if (form.password.trim()) {
        fd.append(
          "password",
          form.password.trim(),
        );
      }

      if (file) {
        fd.append(
          "imageFile",
          file,
        );
      }

      if (shouldRemoveProfileImg) {
        fd.append(
          "removeProfileImg",
          "true",
        );
      }

      await api.post(
        "/api/user/edit",
        fd,
      );

      await syncUserFromServer();

      draftAppliedRef.current = false;

      alert(t("common.success"));
    } catch (err) {
      console.error(
        "更新エラー",
        err,
      );

      alert(t("common.error"));
    } finally {
      setLoading(false);
    }
  };  
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/70 bg-white/90 p-10 text-center text-gray-400 shadow-sm backdrop-blur">
          {t("profile.loadingUser")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("profile.title")}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {t("profile.description")}
          </p>
        </div>


        <div className="grid gap-6 md:grid-cols-[320px_1fr]">


          <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">

            <div className="flex flex-col items-center text-center">

              <img
                src={preview}
                alt={t("profile.previewAlt")}
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow"
              />


              <div className="mt-4">

                <p className="text-lg font-semibold text-gray-900">
                  {form.alias || t("profile.nicknameEmpty")}
                </p>


                <p className="mt-1 text-sm text-gray-500">
                  {form.email || t("profile.emailEmpty")}
                </p>

              </div>


              <label className="mt-5 inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">

                {t("profile.changeImage")}

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


              <button
                type="button"
                onClick={setImageToDefault}
                disabled={loading}
                className="mt-3 text-sm text-pink-500 hover:text-pink-600 disabled:opacity-50"
              >
                {t("profile.resetImage")}
              </button>


            </div>

          </div>



          <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">


            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >


              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t("profile.nickname")}
                </label>


                <input
                  value={form.alias}
                  onChange={(e) => {
                    const nextAlias = e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      alias: nextAlias,
                    }));

                    applyDraftToRedux(
                      nextAlias,
                      preview,
                    );
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  placeholder={t("profile.nicknamePlaceholder")}
                />

              </div>



              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t("profile.password")}
                </label>


                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  placeholder={t("profile.passwordPlaceholder")}
                />


                <p className="mt-2 text-xs text-gray-400">
                  {t("profile.passwordHint")}
                </p>


              </div>



              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t("profile.email")}
                </label>


                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  placeholder="example@mail.com"
                />


              </div>




              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t("profile.phone")}
                </label>


                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                  placeholder={t("profile.phonePlaceholder")}
                />


              </div>



              <div className="flex items-center justify-end gap-3 pt-2">

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {loading
                    ? t("common.saving")
                    : t("common.save")}

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
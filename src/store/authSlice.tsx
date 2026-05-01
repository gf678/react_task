import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface User {
  id?: number;
  loginId: string;
  alias: string;
  profileImg?: string | null;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  isLogin: boolean;
  user: User | null;
}

// ブラウザの再読み込み後もログイン状態を維持するため、localStorage から値を読み込む
const savedToken = localStorage.getItem("accessToken");
const savedUser = localStorage.getItem("user");

const parseSavedUser = (): User | null => {
  try {
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  } catch {
    return null;
  }
};

// ユーザー情報の保存・削除ロジックを一箇所にまとめ、reducer で再利用できるようにする
const persistUser = (user: User | null) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
};

const initialState: AuthState = {
  accessToken: savedToken || null,
  isLogin: !!savedToken,
  user: parseSavedUser(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * ログイン成功時：トークンとユーザー情報を Redux と localStorage の両方に保存する
     */
    setAuth: (
      state,
      action: PayloadAction<{
        accessToken: string;
        user: User;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isLogin = true;

      localStorage.setItem("accessToken", action.payload.accessToken);
      persistUser(action.payload.user);
    },

    /**
     * トークンのみを更新する場合に使用する（リフレッシュトークンによる更新など）
     */
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isLogin = !!action.payload;

      localStorage.setItem("accessToken", action.payload);
    },

    /**
     * サーバーから最新のユーザー情報を取得した際、user オブジェクト全体を差し替える
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      persistUser(action.payload);
    },

    /**
     * ニックネームやプロフィール画像など、一部のフィールドのみを即時反映する場合に使用する
     */
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (!state.user) return;

      state.user = {
        ...state.user,
        ...action.payload,
      };

      persistUser(state.user);
    },

    /**
     * ログアウト時：Redux の状態と localStorage をすべてクリアする
     */
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isLogin = false;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    },
  },
});

export const { setAuth, setAccessToken, setUser, updateUser, logout } =
  authSlice.actions;

export default authSlice.reducer;
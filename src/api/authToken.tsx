let accessToken: string | null = null;
// accessTokenを管理するモジュール

export const setAccessToken = (token: string | null) => { // accessTokenを設定する関数
  accessToken = token;
};

export const getAccessToken = () => accessToken;
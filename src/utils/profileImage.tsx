export const DEFAULT_PROFILE_IMG = "/img/default_profile.png";

const API_ORIGIN =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3003"
    : "http://deer2922.ddns.net:3003";

export const normalizeProfileImg = (value?: string | null) => {
  if (!value) {
    return DEFAULT_PROFILE_IMG;
  }

  const normalizedValue = value.replaceAll("\\", "/");

  if (
    normalizedValue.startsWith("data:") ||
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("https://")
  ) {
    return normalizedValue;
  }

  return `${API_ORIGIN}${
    normalizedValue.startsWith("/") ? normalizedValue : `/${normalizedValue}`
  }`;
};
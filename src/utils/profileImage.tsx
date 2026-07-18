export const DEFAULT_PROFILE_IMG = "/img/default_profile.png";

const API_ORIGIN = import.meta.env.DEV
  ? "http://localhost:3003"
  : window.location.origin;

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
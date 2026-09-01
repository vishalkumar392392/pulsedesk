import type { User } from "../../types/user";

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";

export const authStorage = {
  saveTokens(
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean,
    user: User,
  ) {
    this.clear();

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("accessToken", accessToken);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("user", JSON.stringify(user));
  },

  getAccessToken() {
    return (
      localStorage.getItem(ACCESS_TOKEN) ?? sessionStorage.getItem(ACCESS_TOKEN)
    );
  },

  getRefreshToken() {
    return (
      localStorage.getItem(REFRESH_TOKEN) ??
      sessionStorage.getItem(REFRESH_TOKEN)
    );
  },

  clear() {
    sessionStorage.clear();
    localStorage.clear();
  },
};

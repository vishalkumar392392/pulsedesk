const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";

export const authStorage = {
  saveTokens(accessToken: string, refreshToken: string, rememberMe: boolean) {
    if (rememberMe) {
      localStorage.setItem(ACCESS_TOKEN, accessToken);
      localStorage.setItem(REFRESH_TOKEN, refreshToken);
    } else {
      sessionStorage.setItem(ACCESS_TOKEN, accessToken);
      sessionStorage.setItem(REFRESH_TOKEN, refreshToken);
    }
  },

  getAccessToken() {
    return (
      sessionStorage.getItem(ACCESS_TOKEN) || localStorage.getItem(ACCESS_TOKEN)
    );
  },

  getRefreshToken() {
    return (
      sessionStorage.getItem(REFRESH_TOKEN) ||
      localStorage.getItem(REFRESH_TOKEN)
    );
  },

  clear() {
    sessionStorage.clear();
  },
};

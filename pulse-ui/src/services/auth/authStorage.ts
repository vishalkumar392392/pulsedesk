import type { User } from "../../types/user";

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";
const USER = "user";
const SELECTED_MENU = "selectedMenu";
const AUTH_STORAGE_KEYS = [ACCESS_TOKEN, REFRESH_TOKEN, USER, SELECTED_MENU];
export const AUTH_TOKENS_CHANGED_EVENT = "pulsedesk:tokens-updated";
export const AUTH_USER_CHANGED_EVENT = "pulsedesk:user-updated";

const notifyTokensChanged = () => {
  window.dispatchEvent(new Event(AUTH_TOKENS_CHANGED_EVENT));
};

const notifyUserChanged = () => {
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
};

export const authStorage = {
  saveTokens(
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean,
    user: User,
  ) {
    this.clear();

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(ACCESS_TOKEN, accessToken);
    storage.setItem(REFRESH_TOKEN, refreshToken);
    storage.setItem(USER, JSON.stringify(user));
    notifyUserChanged();
    notifyTokensChanged();
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

  updateTokens(accessToken: string, refreshToken: string) {
    const storage = localStorage.getItem(ACCESS_TOKEN)
      ? localStorage
      : sessionStorage;

    storage.setItem(ACCESS_TOKEN, accessToken);
    storage.setItem(REFRESH_TOKEN, refreshToken);
    notifyTokensChanged();
  },

  updateUser(user: User) {
    const storage = localStorage.getItem("user")
      ? localStorage
      : sessionStorage;

    if (!storage.getItem("user")) return;

    storage.setItem("user", JSON.stringify(user));
    notifyUserChanged();
  },

  clear() {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of AUTH_STORAGE_KEYS) {
        storage.removeItem(key);
      }
    }

    notifyUserChanged();
    notifyTokensChanged();
  },
};

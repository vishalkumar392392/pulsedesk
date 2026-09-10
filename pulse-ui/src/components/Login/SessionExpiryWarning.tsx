import { useCallback, useEffect, useRef, useState } from "react";
import { MdAccessTime } from "react-icons/md";
import { useNavigate } from "react-router";
import { useRefreshSessionMutation } from "../../services/auth/authApi";
import {
  AUTH_TOKENS_CHANGED_EVENT,
  authStorage,
} from "../../services/auth/authStorage";
import { isApiResponse } from "../../services/api/baseQuery";

const WARNING_BEFORE_EXPIRY_MS = 5 * 60_000;

const getTokenExpiry = (token: string) => {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;

    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(paddedBase64)) as { exp?: unknown };

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const getRefreshError = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 401
  ) {
    return "This session can no longer be extended. Please log out and sign in again.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    isApiResponse(error.data)
  ) {
    return error.data.message;
  }

  return "Unable to extend the session. Check your connection and try again.";
};

export const SessionExpiryWarning = () => {
  const navigate = useNavigate();
  const warningTimer = useRef<number | undefined>(undefined);
  const expiryTimer = useRef<number | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [refreshSession, { isLoading: isExtending }] =
    useRefreshSessionMutation();

  const clearTimers = useCallback(() => {
    window.clearTimeout(warningTimer.current);
    window.clearTimeout(expiryTimer.current);
    warningTimer.current = undefined;
    expiryTimer.current = undefined;
  }, []);

  const endSession = useCallback(() => {
    clearTimers();
    setIsOpen(false);
    setRefreshError("");
    authStorage.clear();
    navigate("/login", { replace: true });
  }, [clearTimers, navigate]);

  const scheduleSessionTimers = useCallback(() => {
    clearTimers();
    setRefreshError("");

    const accessToken = authStorage.getAccessToken();
    if (!accessToken) {
      setIsOpen(false);
      return;
    }

    const expiresAt = getTokenExpiry(accessToken);
    if (!expiresAt) {
      endSession();
      return;
    }

    const timeUntilExpiry = expiresAt - Date.now();
    if (timeUntilExpiry <= 0) {
      endSession();
      return;
    }

    const timeUntilWarning = timeUntilExpiry - WARNING_BEFORE_EXPIRY_MS;
    if (timeUntilWarning <= 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      warningTimer.current = window.setTimeout(
        () => setIsOpen(true),
        timeUntilWarning,
      );
    }

    expiryTimer.current = window.setTimeout(endSession, timeUntilExpiry);
  }, [clearTimers, endSession]);

  useEffect(() => {
    const initialSchedule = window.setTimeout(scheduleSessionTimers, 0);

    const handleTokenChange = () => scheduleSessionTimers();
    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleTokenChange);
    window.addEventListener("storage", handleTokenChange);

    return () => {
      window.clearTimeout(initialSchedule);
      clearTimers();
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, handleTokenChange);
      window.removeEventListener("storage", handleTokenChange);
    };
  }, [clearTimers, scheduleSessionTimers]);

  const extendSession = async () => {
    setRefreshError("");
    clearTimers();
    const refreshToken = authStorage.getRefreshToken();

    if (!refreshToken) {
      endSession();
      return;
    }

    try {
      const tokens = await refreshSession({ refreshToken }).unwrap();
      authStorage.updateTokens(tokens.accessToken, tokens.refreshToken);
      setIsOpen(false);
    } catch (error) {
      setRefreshError(getRefreshError(error));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <section
        className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expiry-title"
        aria-describedby="session-expiry-description"
      >
        <MdAccessTime
          aria-hidden="true"
          className="mx-auto rounded-full bg-amber-100 p-3 text-amber-700"
          size={72}
        />
        <h2 id="session-expiry-title" className="mt-5 text-2xl font-bold">
          Your session is about to expire
        </h2>
        <p id="session-expiry-description" className="mt-3 text-gray-600">
          Your session will expire in about five minutes. Extend it to stay
          signed in for another 15 minutes.
        </p>

        {refreshError && (
          <p
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {refreshError}
          </p>
        )}

        <div className="mt-7 flex justify-center gap-3">
          <button
            type="button"
            onClick={endSession}
            disabled={isExtending}
            className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Log out
          </button>
          <button
            type="button"
            onClick={extendSession}
            disabled={isExtending}
            className="bg-blaze-haze-700 hover:bg-blaze-haze-600 cursor-pointer rounded-xl px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExtending ? "Extending…" : "Extend session"}
          </button>
        </div>
      </section>
    </div>
  );
};

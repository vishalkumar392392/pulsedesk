import { useSyncExternalStore } from "react";

// Matches Tailwind's `lg` breakpoint; the desktop layout renders at and above it.
export const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );

export const useIsDesktop = () => useMediaQuery(DESKTOP_MEDIA_QUERY);

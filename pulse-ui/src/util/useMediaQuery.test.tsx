import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resizeViewport, setViewportWidth } from "../test/viewport";
import {
  DESKTOP_MEDIA_QUERY,
  useIsDesktop,
  useMediaQuery,
} from "./useMediaQuery";

describe("useMediaQuery", () => {
  it("uses Tailwind's lg breakpoint for desktop", () => {
    expect(DESKTOP_MEDIA_QUERY).toBe("(min-width: 1024px)");
  });

  it.each([
    [1440, true],
    [1024, true],
    [1023, false],
    [820, false],
    [390, false],
  ])("useIsDesktop at %ipx is %s", (width, expected) => {
    setViewportWidth(width);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(expected);
  });

  it("updates when the viewport crosses the breakpoint", () => {
    setViewportWidth(1440);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);

    resizeViewport(600);
    expect(result.current).toBe(false);

    resizeViewport(1280);
    expect(result.current).toBe(true);
  });

  it("supports arbitrary queries", () => {
    setViewportWidth(500);
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(true);
  });
});

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { setViewportWidth } from "./viewport";

beforeEach(() => {
  setViewportWidth(1440);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  document.body.style.overflow = "";
});

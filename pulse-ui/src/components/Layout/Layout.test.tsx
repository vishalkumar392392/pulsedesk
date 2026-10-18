import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { resizeViewport, setViewportWidth } from "../../test/viewport";
import { Layout } from "./Layout";

const mounts = vi.hoisted(() => ({ desktop: 0, mobile: 0 }));

vi.mock("./Desktop/DesktopLayout", () => ({
  DesktopLayout: () => {
    mounts.desktop++;
    return <div>desktop layout</div>;
  },
}));

vi.mock("./Mobile/MobileLayout", () => ({
  MobileLayout: () => {
    mounts.mobile++;
    return <div>mobile layout</div>;
  },
}));

describe("Layout", () => {
  it.each([1024, 1440])("renders only the desktop layout at %ipx", (width) => {
    setViewportWidth(width);
    render(<Layout />);

    expect(screen.getByText("desktop layout")).toBeInTheDocument();
    expect(screen.queryByText("mobile layout")).not.toBeInTheDocument();
  });

  it.each([390, 820, 1023])(
    "renders only the mobile layout at %ipx",
    (width) => {
      setViewportWidth(width);
      render(<Layout />);

      expect(screen.getByText("mobile layout")).toBeInTheDocument();
      expect(screen.queryByText("desktop layout")).not.toBeInTheDocument();
    },
  );

  it("swaps layouts when the window is resized", () => {
    setViewportWidth(1440);
    render(<Layout />);
    expect(screen.getByText("desktop layout")).toBeInTheDocument();

    resizeViewport(600);
    expect(screen.getByText("mobile layout")).toBeInTheDocument();
    expect(screen.queryByText("desktop layout")).not.toBeInTheDocument();
  });
});

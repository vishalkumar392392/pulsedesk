import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { signInAs } from "../../../test/auth";
import { MobileNavDrawer } from "./MobileNavDrawer";

const renderDrawer = (isOpen: boolean, onClose = vi.fn()) => {
  const result = render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route
          path="*"
          element={<MobileNavDrawer isOpen={isOpen} onClose={onClose} />}
        />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return { ...result, onClose };
};

const getNav = () =>
  screen.getByRole("navigation", { name: "Main navigation", hidden: true });

describe("MobileNavDrawer", () => {
  it("is off-screen, inert and does not lock scroll when closed", () => {
    signInAs();
    renderDrawer(false);

    expect(getNav()).toHaveClass("-translate-x-full");
    expect(getNav()).toHaveAttribute("inert");
    expect(getNav().parentElement).toHaveAttribute("aria-hidden", "true");
    expect(document.body.style.overflow).toBe("");
  });

  it("slides in and locks body scroll when open", () => {
    signInAs();
    renderDrawer(true);

    expect(getNav()).toHaveClass("translate-x-0");
    expect(getNav()).not.toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("shows the signed-in user and every permitted menu item", () => {
    signInAs();
    renderDrawer(true);
    const nav = within(getNav());

    expect(nav.getByText("Vishal P.")).toBeInTheDocument();
    for (const item of [
      "Dashboard",
      "Tickets",
      "Assets",
      "Users",
      "Reports",
      "Settings",
    ]) {
      expect(nav.getByRole("link", { name: item })).toBeInTheDocument();
    }
    expect(nav.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it.each([
    [
      "the close button",
      () => fireEvent.click(screen.getByLabelText("Close menu")),
    ],
    ["the Escape key", () => fireEvent.keyDown(document, { key: "Escape" })],
    [
      "the backdrop",
      () => fireEvent.click(getNav().previousElementSibling as Element),
    ],
    [
      "choosing a menu item",
      () => fireEvent.click(screen.getByRole("link", { name: "Tickets" })),
    ],
  ])("closes via %s", (_label, act) => {
    signInAs();
    const { onClose } = renderDrawer(true);

    act();
    expect(onClose).toHaveBeenCalled();
  });

  it("ignores Escape while closed", () => {
    signInAs();
    const { onClose } = renderDrawer(false);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("logs out, closes and returns to the login page", () => {
    signInAs();
    const { onClose } = renderDrawer(true);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onClose).toHaveBeenCalled();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("restores body scroll after closing", () => {
    signInAs();
    const { rerender } = renderDrawer(true);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <MemoryRouter>
        <MobileNavDrawer isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(document.body.style.overflow).toBe("");
  });
});

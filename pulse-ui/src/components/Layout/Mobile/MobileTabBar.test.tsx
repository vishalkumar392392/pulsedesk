import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ADMIN_USER, signInAs } from "../../../test/auth";
import type { User } from "../../../types/user";
import { MobileTabBar } from "./MobileTabBar";

const renderTabBar = (path = "/dashboard", onOpenMenu = vi.fn()) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <MobileTabBar onOpenMenu={onOpenMenu} />
    </MemoryRouter>,
  );
  return within(screen.getByRole("navigation", { name: "Quick navigation" }));
};

const tabLabels = (nav: ReturnType<typeof renderTabBar>) =>
  nav.getAllByRole("link").map((link) => link.textContent);

describe("MobileTabBar", () => {
  it.each<[User["role"], string[]]>([
    ["admin", ["Dashboard", "Tickets", "Assets", "Users"]],
    ["agent", ["Dashboard", "Tickets", "Assets"]],
    ["employee", ["Dashboard", "Tickets"]],
  ])("shows the %s's permitted tabs (max 4)", (role, expected) => {
    signInAs({ ...ADMIN_USER, role });
    expect(tabLabels(renderTabBar())).toEqual(expected);
  });

  it("never shows Settings or Logout as tabs", () => {
    signInAs();
    const nav = renderTabBar();

    expect(nav.queryByText("Settings")).not.toBeInTheDocument();
    expect(nav.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("shows no route tabs when signed out", () => {
    const nav = renderTabBar();
    expect(nav.queryAllByRole("link")).toHaveLength(0);
    expect(nav.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });

  it("links each tab to its route and marks the active one", () => {
    signInAs();
    const nav = renderTabBar("/tickets");

    const tickets = nav.getByRole("link", { name: "Tickets" });
    expect(tickets).toHaveAttribute("href", "/tickets");
    expect(tickets).toHaveAttribute("aria-current", "page");
    expect(tickets).toHaveClass("text-pulse-green");

    const dashboard = nav.getByRole("link", { name: "Dashboard" });
    expect(dashboard).not.toHaveAttribute("aria-current");
    expect(dashboard).toHaveClass("text-gray-500");
  });

  it("opens the menu from the Menu button", () => {
    signInAs();
    const onOpenMenu = vi.fn();
    const nav = renderTabBar("/dashboard", onOpenMenu);

    fireEvent.click(nav.getByRole("button", { name: "Menu" }));
    expect(onOpenMenu).toHaveBeenCalledOnce();
  });

  it("is hidden from md upwards", () => {
    renderTabBar();
    expect(
      screen.getByRole("navigation", { name: "Quick navigation" }),
    ).toHaveClass("md:hidden");
  });
});

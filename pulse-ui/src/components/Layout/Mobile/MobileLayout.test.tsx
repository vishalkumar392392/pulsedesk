import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { signInAs } from "../../../test/auth";
import { MobileLayout } from "./MobileLayout";

vi.mock("../../Notifications/NotificationBell", () => ({
  NotificationBell: () => <button type="button">Notifications</button>,
}));

const renderLayout = (path = "/tickets") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<MobileLayout />}>
          <Route path="/tickets" element={<p>tickets page</p>} />
          <Route path="/dashboard" element={<p>dashboard page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

const getDrawer = () =>
  screen.getByRole("navigation", { name: "Main navigation", hidden: true });

describe("MobileLayout", () => {
  it("renders the header, breadcrumb, routed page and tab bar", () => {
    signInAs();
    renderLayout();

    expect(screen.getByRole("banner")).toHaveTextContent("PulseDesk");
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByLabelText("Signed in as Vishal P.")).toBeInTheDocument();
    expect(screen.getByText("Support workspace")).toBeInTheDocument();
    expect(screen.getByText("tickets page")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Quick navigation" }),
    ).toBeInTheDocument();
  });

  it("starts with the drawer closed", () => {
    signInAs();
    renderLayout();

    expect(getDrawer()).toHaveAttribute("inert");
    expect(screen.getByLabelText("Open menu")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("shows the hamburger only from md (the tab bar covers phones)", () => {
    signInAs();
    renderLayout();

    expect(screen.getByLabelText("Open menu")).toHaveClass("hidden", "md:flex");
  });

  it.each([
    [
      "the hamburger",
      () => fireEvent.click(screen.getByLabelText("Open menu")),
    ],
    [
      "the tab bar Menu button",
      () => fireEvent.click(screen.getByRole("button", { name: "Menu" })),
    ],
  ])("opens and closes the drawer from %s", (_label, open) => {
    signInAs();
    renderLayout();

    open();
    expect(getDrawer()).not.toHaveAttribute("inert");
    expect(screen.getByLabelText("Open menu")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.click(screen.getByLabelText("Close menu"));
    expect(getDrawer()).toHaveAttribute("inert");
  });

  it("navigates and closes the drawer when a menu item is chosen", () => {
    signInAs();
    renderLayout("/tickets");

    fireEvent.click(screen.getByLabelText("Open menu"));
    fireEvent.click(
      screen
        .getAllByRole("link", { name: "Dashboard" })
        .find((link) => getDrawer().contains(link))!,
    );

    expect(screen.getByText("dashboard page")).toBeInTheDocument();
    expect(getDrawer()).toHaveAttribute("inert");
  });

  it("leaves room for the fixed tab bar below the content", () => {
    signInAs();
    renderLayout();

    expect(screen.getByRole("main").className).toContain(
      "pb-[calc(6rem+env(safe-area-inset-bottom))]",
    );
  });
});

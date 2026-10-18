import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { store } from "../../app/store";
import { ADMIN_USER, signInAs } from "../../test/auth";
import { Login } from "./Login";

const login = vi.hoisted(() => vi.fn());

vi.mock("../../services/auth/authApi", () => ({
  useLoginMutation: () => [login],
}));

const renderLogin = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<p>dashboard page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

const fillIn = (email: string, password: string) => {
  fireEvent.change(screen.getByPlaceholderText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("Password"), {
    target: { value: password },
  });
};

describe("Login", () => {
  beforeEach(() => {
    login.mockReset();
  });

  it("centres the form vertically and horizontally in a full-height page", () => {
    renderLogin();

    const main = screen.getByRole("main");
    expect(main).toHaveClass(
      "flex",
      "min-h-dvh",
      "items-center",
      "justify-center",
    );
    expect(main.firstElementChild?.tagName).toBe("FORM");
  });

  it("keeps the desktop card size and adapts it below lg", () => {
    renderLogin();

    const form = screen.getByRole("main").firstElementChild;
    expect(form).toHaveClass("w-[45%]", "p-15");
    expect(form).toHaveClass("max-lg:w-full", "max-lg:max-w-md", "max-sm:p-6");
    expect(form).not.toHaveClass("mx-auto", "my-2");
  });

  it("disables Login until the form is valid", async () => {
    renderLogin();
    const button = screen.getByRole("button", { name: "Login" });
    expect(button).toBeDisabled();

    fillIn("not-an-email", "short");
    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 6 characters"),
    ).toBeInTheDocument();
    expect(button).toBeDisabled();

    fillIn("vishal@gmail.com", "vishal123");
    await waitFor(() => expect(button).toBeEnabled());
  });

  it("stores the session and goes to the dashboard on success", async () => {
    login.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: {
            accessToken: "access",
            refreshToken: "refresh",
            user: ADMIN_USER,
          },
        }),
    });
    renderLogin();

    fillIn("vishal@gmail.com", "vishal123");
    fireEvent.click(screen.getByRole("checkbox", { name: "Remember me" }));
    const button = screen.getByRole("button", { name: "Login" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(await screen.findByText("dashboard page")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({
      email: "vishal@gmail.com",
      password: "vishal123",
      rememberMe: true,
    });
    expect(localStorage.getItem("accessToken")).toBe("access");
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(ADMIN_USER);
  });

  it("shows the server error and clears the password on failure", async () => {
    login.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: { success: false, message: "Invalid credentials", data: null },
        }),
    });
    renderLogin();

    fillIn("vishal@gmail.com", "wrongpass");
    const button = screen.getByRole("button", { name: "Login" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toHaveValue("");
  });

  it("redirects to the dashboard when already signed in", () => {
    signInAs();
    renderLogin();
    expect(screen.getByText("dashboard page")).toBeInTheDocument();
  });
});

import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AUTH_USER_CHANGED_EVENT } from "../../services/auth/authStorage";
import { ADMIN_USER, signInAs } from "../../test/auth";
import { LoggedInUser } from "./LoggedInUser";

describe("LoggedInUser", () => {
  it("renders nothing when signed out", () => {
    const { container } = render(<LoggedInUser />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the full card with name and role by default", () => {
    signInAs();
    render(<LoggedInUser />);

    expect(screen.getByText("VP")).toBeInTheDocument();
    expect(screen.getByText("Vishal P.")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows only an initials avatar in compact mode", () => {
    signInAs();
    render(<LoggedInUser compact />);

    const avatar = screen.getByLabelText("Signed in as Vishal P.");
    expect(avatar).toHaveTextContent("VP");
    expect(avatar).toHaveAttribute("title", "Vishal P. · Admin");
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("refreshes when the stored user changes", () => {
    signInAs();
    render(<LoggedInUser compact />);

    act(() => {
      signInAs({ ...ADMIN_USER, name: "jane doe", role: "agent" });
      window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
    });

    expect(screen.getByLabelText("Signed in as Jane D.")).toHaveTextContent(
      "JD",
    );
  });
});

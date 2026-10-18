import type { User } from "../types/user";

export const ADMIN_USER: User = {
  id: 1,
  name: "vishal palla",
  email: "vishal@gmail.com",
  role: "admin",
  status: "ACTIVE",
};

export const signInAs = (user: User = ADMIN_USER) => {
  localStorage.setItem("accessToken", "test-access-token");
  localStorage.setItem("refreshToken", "test-refresh-token");
  localStorage.setItem("user", JSON.stringify(user));
};

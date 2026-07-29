export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin" | "agent" | "employee";
  status: "invited" | "active";
  initials: string;
  createdAt: string;
}

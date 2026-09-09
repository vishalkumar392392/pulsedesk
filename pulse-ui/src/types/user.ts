export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "agent" | "employee";
  status: "ACTIVE" | "INACTIVE";
  initials?: string;
  createdAt?: string;
}

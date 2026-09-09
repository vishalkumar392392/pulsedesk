export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  initials?: string;
  assigneeId: string | null;
  createdAt: string;
  createdAtTimestamp?: string | null;
  resolvedAt?: string | null;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  category: string;
  initials?: string;
  assigneeId: string | null;
  assigneeName?: string | null;
  requesterId?: string | null;
  requesterName?: string | null;
  createdAt: string;
  createdAtTimestamp?: string | null;
  resolvedAt?: string | null;
}

export interface TicketAssignee {
  id: number;
  name: string;
  email: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
}

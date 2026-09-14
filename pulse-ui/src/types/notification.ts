export interface Notification {
  id: number;
  type: "TICKET_COMMENT_ADDED";
  ticketId: number;
  commentId: number;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  content: Notification[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

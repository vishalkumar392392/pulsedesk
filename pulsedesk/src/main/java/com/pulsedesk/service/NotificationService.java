package com.pulsedesk.service;

import com.pulsedesk.modal.NotificationModal;
import com.pulsedesk.modal.PageResponse;

public interface NotificationService {

	void createCommentNotification(Integer ticketId, String ticketTitle, Long commentId, Integer authorId,
			String authorName, Integer requesterId, Integer assigneeId);

	PageResponse<NotificationModal> getNotifications(String email, int page, int size, boolean unreadOnly);

	long getUnreadCount(String email);

	void markRead(Long notificationId, String email);

	void markTicketCommentsRead(Integer ticketId, String email);

	void markAllRead(String email);
}

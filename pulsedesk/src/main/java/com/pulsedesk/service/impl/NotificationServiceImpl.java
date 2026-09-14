package com.pulsedesk.service.impl;

import java.time.LocalDateTime;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.entites.NotificationEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.enums.NotificationType;
import com.pulsedesk.exception.UserNotFoundException;
import com.pulsedesk.modal.NotificationModal;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.repository.NotificationRepository;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.NotificationService;

@Service
public class NotificationServiceImpl implements NotificationService {

	@Autowired
	private NotificationRepository notificationRepository;

	@Autowired
	private UserRepository userRepository;

	@Override
	@Transactional
	public void createCommentNotification(Integer ticketId, String ticketTitle, Long commentId, Integer authorId,
			String authorName, Integer requesterId, Integer assigneeId) {
		Integer recipientId = resolveCommentRecipient(authorId, requesterId, assigneeId);
		if (recipientId == null) {
			return;
		}

		NotificationEntity notification = new NotificationEntity();
		notification.setRecipientUserId(recipientId);
		notification.setType(NotificationType.TICKET_COMMENT_ADDED);
		notification.setTicketId(ticketId);
		notification.setCommentId(commentId);
		notification.setMessage(authorName + " commented on ticket #" + ticketId + ": " + ticketTitle);
		notification.setCreatedAt(LocalDateTime.now());
		notificationRepository.save(notification);
	}

	static Integer resolveCommentRecipient(Integer authorId, Integer requesterId, Integer assigneeId) {
		Integer recipientId = Objects.equals(authorId, requesterId) ? assigneeId : requesterId;
		return Objects.equals(recipientId, authorId) ? null : recipientId;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<NotificationModal> getNotifications(String email, int page, int size, boolean unreadOnly) {
		Integer userId = getAuthenticatedUser(email).getId();
		int currentPage = Math.max(page, 0);
		int pageSize = Math.min(Math.max(size, 1), 100);
		PageRequest pageable = PageRequest.of(currentPage, pageSize);
		Page<NotificationEntity> notifications = unreadOnly
				? notificationRepository.findByRecipientUserIdAndReadAtIsNullOrderByCreatedAtDescIdDesc(userId, pageable)
				: notificationRepository.findByRecipientUserIdOrderByCreatedAtDescIdDesc(userId, pageable);
		Page<NotificationModal> modals = notifications.map(NotificationServiceImpl::toModal);

		return new PageResponse<>(modals.getContent(), modals.getNumber(), modals.getSize(), modals.getTotalElements(),
				modals.getTotalPages(), modals.isFirst(), modals.isLast());
	}

	@Override
	@Transactional(readOnly = true)
	public long getUnreadCount(String email) {
		return notificationRepository.countByRecipientUserIdAndReadAtIsNull(getAuthenticatedUser(email).getId());
	}

	@Override
	@Transactional
	public void markRead(Long notificationId, String email) {
		Integer userId = getAuthenticatedUser(email).getId();
		NotificationEntity notification = notificationRepository.findByIdAndRecipientUserId(notificationId, userId)
				.orElseThrow(() -> new UserNotFoundException("Notification not found"));
		if (notification.getReadAt() == null) {
			notification.setReadAt(LocalDateTime.now());
			notificationRepository.save(notification);
		}
	}

	@Override
	@Transactional
	public void markTicketCommentsRead(Integer ticketId, String email) {
		notificationRepository.markTicketNotificationsRead(getAuthenticatedUser(email).getId(), ticketId,
				NotificationType.TICKET_COMMENT_ADDED, LocalDateTime.now());
	}

	@Override
	@Transactional
	public void markAllRead(String email) {
		notificationRepository.markAllRead(getAuthenticatedUser(email).getId(), LocalDateTime.now());
	}

	private UserEntity getAuthenticatedUser(String email) {
		return userRepository.findByEmail(email).stream().findFirst()
				.orElseThrow(() -> new UserNotFoundException("Authenticated user was not found"));
	}

	private static NotificationModal toModal(NotificationEntity notification) {
		return new NotificationModal(notification.getId(), notification.getType().name(), notification.getTicketId(),
				notification.getCommentId(), notification.getMessage(), notification.getReadAt() != null,
				notification.getReadAt() == null ? null : notification.getReadAt().toString(),
				notification.getCreatedAt().toString());
	}
}

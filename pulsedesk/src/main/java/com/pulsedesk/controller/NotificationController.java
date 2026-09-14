package com.pulsedesk.controller;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.modal.ApiResponse;
import com.pulsedesk.modal.NotificationModal;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.UnreadNotificationCountModal;
import com.pulsedesk.service.NotificationService;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

	@Autowired
	private NotificationService notificationService;

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<NotificationModal>>> getNotifications(Principal principal,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "false") boolean unreadOnly) {
		PageResponse<NotificationModal> notifications = notificationService.getNotifications(principal.getName(), page,
				size, unreadOnly);
		return ResponseEntity.ok(ApiResponse.success(notifications, "Fetched notifications successfully",
				HttpStatus.OK.value()));
	}

	@GetMapping("/unread-count")
	public ResponseEntity<ApiResponse<UnreadNotificationCountModal>> getUnreadCount(Principal principal) {
		UnreadNotificationCountModal count = new UnreadNotificationCountModal(
				notificationService.getUnreadCount(principal.getName()));
		return ResponseEntity.ok(ApiResponse.success(count, "Fetched unread notification count successfully",
				HttpStatus.OK.value()));
	}

	@PatchMapping("/{notificationId}/read")
	public ResponseEntity<Void> markRead(@PathVariable Long notificationId, Principal principal) {
		notificationService.markRead(notificationId, principal.getName());
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/ticket/{ticketId}/read")
	public ResponseEntity<Void> markTicketCommentsRead(@PathVariable Integer ticketId, Principal principal) {
		notificationService.markTicketCommentsRead(ticketId, principal.getName());
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/read-all")
	public ResponseEntity<Void> markAllRead(Principal principal) {
		notificationService.markAllRead(principal.getName());
		return ResponseEntity.noContent().build();
	}
}

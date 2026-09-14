package com.pulsedesk.entites;

import java.time.LocalDateTime;

import com.pulsedesk.enums.NotificationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
public class NotificationEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "recipient_user_id", nullable = false)
	private Integer recipientUserId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private NotificationType type;

	@Column(name = "ticket_id", nullable = false)
	private Integer ticketId;

	@Column(name = "comment_id", nullable = false)
	private Long commentId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String message;

	@Column(name = "read_at")
	private LocalDateTime readAt;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;
}

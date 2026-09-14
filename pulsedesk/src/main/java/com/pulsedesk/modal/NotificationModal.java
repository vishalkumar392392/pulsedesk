package com.pulsedesk.modal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationModal {
	private Long id;
	private String type;
	private Integer ticketId;
	private Long commentId;
	private String message;
	private boolean read;
	private String readAt;
	private String createdAt;
}

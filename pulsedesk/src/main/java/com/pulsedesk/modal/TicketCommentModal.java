package com.pulsedesk.modal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TicketCommentModal {

	private Long id;
	private Integer ticketId;
	private Integer authorId;
	private String authorName;
	private String body;
	private String createdAt;
}

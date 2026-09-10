package com.pulsedesk.repository;

import java.time.LocalDateTime;

public interface TicketCommentProjection {

	Long getId();

	Integer getTicketId();

	Integer getAuthorId();

	String getAuthorName();

	String getBody();

	LocalDateTime getCreatedAt();
}

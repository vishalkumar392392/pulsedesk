package com.pulsedesk.repository;

import java.time.LocalDateTime;

public interface TicketDetailsProjection {

	Integer getId();

	String getTitle();

	String getDescription();

	String getCategory();

	String getPriority();

	String getStatus();

	Integer getRequesterId();

	String getRequesterName();

	Integer getAssigneeId();

	String getAssigneeName();

	LocalDateTime getCreatedAt();

	LocalDateTime getResolvedAt();
}

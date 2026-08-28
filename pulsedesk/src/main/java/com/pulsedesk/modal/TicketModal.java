package com.pulsedesk.modal;

import java.util.List;

import com.pulsedesk.enums.TicketStatus;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TicketModal {

	private Integer id;
	private String title;
	private String description;
	private String category;
	private String priority;
	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TicketStatus status;
	@Column(name = "requester_id")
	private String requesterId;
	private List<Integer> affectedAssetIds;
	private String createdAt;
	private String assigneeId;

}

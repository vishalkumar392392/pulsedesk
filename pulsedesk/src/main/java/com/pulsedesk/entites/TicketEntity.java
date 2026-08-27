package com.pulsedesk.entites;

import com.pulsedesk.enums.TicketStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class TicketEntity {

	@Id
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
	@Column(name = "created_at")
	private String createdAt;

}

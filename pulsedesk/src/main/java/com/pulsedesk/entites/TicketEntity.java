package com.pulsedesk.entites;

import java.time.LocalDateTime;

import com.pulsedesk.enums.TicketStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tickets")
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
	private Integer requesterId;
	@Column(name = "created_at")
	private LocalDateTime createdAt;
	@Column(name = "assignee_id")
	private Integer assigneeId;

}

package com.pulsedesk.assignment.service;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class TicketCreatedEvent {
	
	UUID eventId;
    String eventType;
    Integer eventVersion;
    LocalDateTime occurredAt;
    Long ticketId;
    Integer requesterId;
    String title;
    String priority;

}

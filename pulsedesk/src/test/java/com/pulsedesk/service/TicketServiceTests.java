package com.pulsedesk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pulsedesk.modal.TicketModal;
import com.pulsedesk.repository.RoleRepository;
import com.pulsedesk.repository.TicketDetailsProjection;
import com.pulsedesk.repository.TicketRepository;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.NotificationService;
import com.pulsedesk.service.impl.TicketServiceImpl;

@ExtendWith(MockitoExtension.class)
class TicketServiceTests {

	@Mock
	private TicketRepository ticketRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private RoleRepository roleRepository;

	@Mock
	private NotificationService notificationService;

	@InjectMocks
	private TicketServiceImpl ticketService;

	@Test
	void autoAssignsUsingLeastLoadedAgentWithoutDatabase() {
		TicketDetailsProjection unassignedTicket = ticket(7, null);
		TicketDetailsProjection assignedTicket = ticket(7, 31);
		when(ticketRepository.getTicketDetails(7)).thenReturn(Optional.of(unassignedTicket), Optional.of(assignedTicket));
		when(ticketRepository.findLeastLoadedActiveAgentId()).thenReturn(Optional.of(31));
		when(ticketRepository.autoAssignTicketIfUnassigned(7, 31)).thenReturn(1);

		TicketModal result = ticketService.autoAssign(7);

		assertThat(result.getId()).isEqualTo(7);
		assertThat(result.getAssigneeId()).isEqualTo("31");
		verify(ticketRepository).autoAssignTicketIfUnassigned(7, 31);
	}

	private static TicketDetailsProjection ticket(Integer ticketId, Integer assigneeId) {
		return new TicketDetailsProjection() {
			@Override public Integer getId() { return ticketId; }
			@Override public String getTitle() { return "Printer offline"; }
			@Override public String getDescription() { return "Printer cannot be reached"; }
			@Override public String getCategory() { return "Hardware"; }
			@Override public String getPriority() { return "MEDIUM"; }
			@Override public String getStatus() { return "OPEN"; }
			@Override public Integer getRequesterId() { return 11; }
			@Override public String getRequesterName() { return "Requester"; }
			@Override public Integer getAssigneeId() { return assigneeId; }
			@Override public String getAssigneeName() { return assigneeId == null ? null : "Agent"; }
			@Override public LocalDateTime getCreatedAt() { return LocalDateTime.of(2026, 9, 1, 9, 0); }
			@Override public LocalDateTime getResolvedAt() { return null; }
		};
	}
}

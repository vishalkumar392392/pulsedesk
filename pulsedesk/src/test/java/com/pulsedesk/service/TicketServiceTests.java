package com.pulsedesk.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.modal.TicketAssigneeModal;
import com.pulsedesk.modal.TicketCommentModal;
import com.pulsedesk.modal.TicketModal;

@SpringBootTest
@Transactional
class TicketServiceTests {

	@Autowired
	private TicketService ticketService;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void loadsAndUpdatesTicketDetailsAndComments() {
		Integer ticketId = jdbcTemplate.queryForObject("SELECT id FROM tickets ORDER BY id LIMIT 1", Integer.class);
		String supportEmail = jdbcTemplate.queryForObject("""
				SELECT u.email
				FROM users u
				JOIN role r ON r.id = u.role_id
				WHERE LOWER(r.name) IN ('agent', 'admin')
				  AND u.status = 'ACTIVE'
				ORDER BY CASE WHEN LOWER(r.name) = 'agent' THEN 0 ELSE 1 END, u.user_id
				LIMIT 1
				""", String.class);

		TicketModal ticket = ticketService.getTicket(ticketId, supportEmail);
		assertEquals(ticketId, ticket.getId());
		assertNotNull(ticket.getRequesterName());

		List<TicketCommentModal> before = ticketService.getComments(ticketId, supportEmail);
		ticketService.createComment(ticketId, "Integration test comment", supportEmail);
		List<TicketCommentModal> after = ticketService.getComments(ticketId, supportEmail);
		assertEquals(before.size() + 1, after.size());

		String nextStatus = "OPEN".equals(ticket.getStatus().name()) ? "IN_PROGRESS" : "OPEN";
		TicketModal statusUpdated = ticketService.updateStatus(ticketId, nextStatus, supportEmail);
		assertEquals(nextStatus, statusUpdated.getStatus().name());

		List<TicketAssigneeModal> agents = ticketService.getAssignableAgents();
		assertFalse(agents.isEmpty());
		TicketModal assigned = ticketService.updateAssignee(ticketId, agents.get(0).getId(), supportEmail);
		assertEquals(String.valueOf(agents.get(0).getId()), assigned.getAssigneeId());

		TicketModal unassigned = ticketService.updateAssignee(ticketId, null, supportEmail);
		assertNull(unassigned.getAssigneeId());
	}
}

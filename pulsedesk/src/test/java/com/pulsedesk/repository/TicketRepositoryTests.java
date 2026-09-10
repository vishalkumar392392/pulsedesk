package com.pulsedesk.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;

import com.pulsedesk.entites.TicketEntity;

@SpringBootTest
class TicketRepositoryTests {

	@Autowired
	private TicketRepository ticketRepository;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void findsFilteredAndPaginatedTicketsForRequesterEmail() {
		String email = jdbcTemplate.queryForObject("""
				SELECT u.email
				FROM tickets t
				JOIN users u ON u.user_id = t.requester_id
				ORDER BY t.id
				LIMIT 1
				""", String.class);

		Page<TicketEntity> tickets = ticketRepository.getTickets(
				email, 1, null, null, "id", "asc", PageRequest.of(0, 1));

		assertFalse(tickets.isEmpty());
		assertEquals(0, tickets.getNumber());
		assertEquals(1, tickets.getSize());
		assertTrue(tickets.getTotalElements() >= 1);
		assertTrue(tickets.getTotalPages() >= 1);

		String status = tickets.getContent().get(0).getStatus().name();
		Page<TicketEntity> filteredTickets = ticketRepository.getTickets(
				email, 1, status, null, "createdAt", "desc", PageRequest.of(0, 10));

		assertTrue(filteredTickets.stream().allMatch(ticket -> ticket.getStatus().name().equals(status)));
	}
}

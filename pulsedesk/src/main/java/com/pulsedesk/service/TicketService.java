package com.pulsedesk.service;

import java.util.List;

import com.pulsedesk.modal.TicketModal;

public interface TicketService {

	TicketModal createTicket(TicketModal ticketModal, String email);

	List<TicketModal> getTickets(String name);

}

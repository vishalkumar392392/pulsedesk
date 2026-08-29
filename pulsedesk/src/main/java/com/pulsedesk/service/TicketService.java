package com.pulsedesk.service;

import java.util.List;

import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.TicketModal;

public interface TicketService {

	TicketModal createTicket(TicketModal ticketModal, String email);

	PageResponse<TicketModal> getTickets(String email, int page, int size, String status, String priority,
			String sort, String direction);

	List<TicketModal> getAllTickets();

}

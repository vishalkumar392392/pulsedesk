package com.pulsedesk.service;

import java.util.List;

import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.TicketAssigneeModal;
import com.pulsedesk.modal.TicketCommentModal;
import com.pulsedesk.modal.TicketModal;

public interface TicketService {

	TicketModal createTicket(TicketModal ticketModal, String email);

	PageResponse<TicketModal> getTickets(String email, int page, int size, String status, String priority,
			String sort, String direction);

	List<TicketModal> getAllTickets();

	TicketModal getTicket(Integer ticketId, String email);

	TicketModal updateStatus(Integer ticketId, String status, String email);

	TicketModal updateAssignee(Integer ticketId, Integer assigneeId, String email);

	TicketModal autoAssign(Integer ticketId);

	List<TicketAssigneeModal> getAssignableAgents();

	List<TicketCommentModal> getComments(Integer ticketId, String email);

	void createComment(Integer ticketId, String body, String email);

}

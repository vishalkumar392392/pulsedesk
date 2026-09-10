package com.pulsedesk.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.modal.ApiResponse;
import com.pulsedesk.modal.TicketModal;
import com.pulsedesk.service.TicketService;

@RestController
@RequestMapping("/internal/tickets")
public class InternalTicketController {

	@Autowired
	private TicketService ticketService;

	@PatchMapping("/{ticketId}/auto-assign")
	public ResponseEntity<ApiResponse<TicketModal>> autoAssign(@PathVariable Integer ticketId) {
		TicketModal ticket = ticketService.autoAssign(ticketId);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(ticket, "Ticket auto-assigned successfully", HttpStatus.OK.value()));
	}
}

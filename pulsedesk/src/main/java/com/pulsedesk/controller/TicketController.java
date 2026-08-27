package com.pulsedesk.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.modal.ApiResponse;
import com.pulsedesk.modal.TicketModal;
import com.pulsedesk.service.TicketService;

@RestController
@RequestMapping("/ticket")
public class TicketController {

	@Autowired
	private TicketService ticketService;

	@PostMapping("/create")
	public ResponseEntity<ApiResponse<TicketModal>> createTicket(@RequestBody TicketModal ticketModal, Principal principal) {

		TicketModal modal = ticketService.createTicket(ticketModal, principal.getName());

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success(modal, "Ticket Created Successfully", HttpStatus.CREATED.value()));

	}
	
	@GetMapping("/mine")
	public ResponseEntity<ApiResponse<List<TicketModal>>> getTickets( Principal principal) {

		List<TicketModal> modal = ticketService.getTickets(principal.getName());

		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(modal, "Fetched tickets Successfully", HttpStatus.OK.value()));

	}

}

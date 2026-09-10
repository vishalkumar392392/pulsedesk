package com.pulsedesk.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.modal.ApiResponse;
import com.pulsedesk.modal.CreateTicketCommentRequest;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.TicketAssigneeModal;
import com.pulsedesk.modal.TicketCommentModal;
import com.pulsedesk.modal.TicketModal;
import com.pulsedesk.modal.UpdateTicketAssigneeRequest;
import com.pulsedesk.modal.UpdateTicketStatusRequest;
import com.pulsedesk.service.TicketService;

@RestController
@RequestMapping("/ticket")
public class TicketController {

	@Autowired
	private TicketService ticketService;

	@PostMapping("/create")
	@PreAuthorize("hasAnyAuthority('employee', 'agent', 'admin')")
	public ResponseEntity<ApiResponse<TicketModal>> createTicket(@RequestBody TicketModal ticketModal, Principal principal) {

		TicketModal modal = ticketService.createTicket(ticketModal, principal.getName());

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success(modal, "Ticket Created Successfully", HttpStatus.CREATED.value()));

	}

	@GetMapping("/mine")
	@PreAuthorize("hasAnyAuthority('employee', 'agent', 'admin')")
	public ResponseEntity<ApiResponse<PageResponse<TicketModal>>> getTickets(
			Principal principal,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "25") int size,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String priority,
			@RequestParam(defaultValue = "createdAt") String sort,
			@RequestParam(defaultValue = "desc") String direction) {

		PageResponse<TicketModal> tickets = ticketService.getTickets(
				principal.getName(), page, size, status, priority, sort, direction);

		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(tickets, "Fetched tickets successfully", HttpStatus.OK.value()));

	}
	
	@GetMapping("/all")
	@PreAuthorize("hasAnyAuthority('agent', 'admin')")
	public ResponseEntity<ApiResponse<List<TicketModal>>> getAllTickets(
			) {

		List<TicketModal> tickets = ticketService.getAllTickets();

		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(tickets, "Fetched tickets successfully", HttpStatus.OK.value()));

	}

	@GetMapping("/assignees")
	@PreAuthorize("hasAnyAuthority('agent', 'admin')")
	public ResponseEntity<ApiResponse<List<TicketAssigneeModal>>> getAssignableAgents() {
		List<TicketAssigneeModal> agents = ticketService.getAssignableAgents();
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(agents, "Fetched ticket assignees successfully", HttpStatus.OK.value()));
	}

	@GetMapping("/{ticketId}")
	public ResponseEntity<ApiResponse<TicketModal>> getTicket(@PathVariable Integer ticketId, Principal principal) {
		TicketModal ticket = ticketService.getTicket(ticketId, principal.getName());
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(ticket, "Fetched ticket successfully", HttpStatus.OK.value()));
	}

	@PatchMapping("/{ticketId}/status")
	@PreAuthorize("hasAnyAuthority('agent', 'admin')")
	public ResponseEntity<ApiResponse<TicketModal>> updateStatus(@PathVariable Integer ticketId,
			@RequestBody UpdateTicketStatusRequest request, Principal principal) {
		TicketModal ticket = ticketService.updateStatus(ticketId, request == null ? null : request.getStatus(),
				principal.getName());
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(ticket, "Ticket status updated successfully", HttpStatus.OK.value()));
	}

	@PatchMapping("/{ticketId}/assignee")
	@PreAuthorize("hasAnyAuthority('agent', 'admin')")
	public ResponseEntity<ApiResponse<TicketModal>> updateAssignee(@PathVariable Integer ticketId,
			@RequestBody UpdateTicketAssigneeRequest request, Principal principal) {
		TicketModal ticket = ticketService.updateAssignee(ticketId, request == null ? null : request.getAssigneeId(),
				principal.getName());
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(ticket, "Ticket assignee updated successfully", HttpStatus.OK.value()));
	}

	@GetMapping("/{ticketId}/comments")
	public ResponseEntity<ApiResponse<List<TicketCommentModal>>> getComments(@PathVariable Integer ticketId,
			Principal principal) {
		List<TicketCommentModal> comments = ticketService.getComments(ticketId, principal.getName());
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(comments, "Fetched comments successfully", HttpStatus.OK.value()));
	}

	@PostMapping("/{ticketId}/comments")
	public ResponseEntity<ApiResponse<Void>> createComment(@PathVariable Integer ticketId,
			@RequestBody CreateTicketCommentRequest request, Principal principal) {
		ticketService.createComment(ticketId, request == null ? null : request.getBody(), principal.getName());
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success(null, "Comment created successfully", HttpStatus.CREATED.value()));
	}

}

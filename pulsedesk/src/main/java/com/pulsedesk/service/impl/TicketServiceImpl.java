package com.pulsedesk.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.entites.RoleEntity;
import com.pulsedesk.entites.TicketEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.entites.UserTicketEntity;
import com.pulsedesk.enums.TicketStatus;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.exception.UserNotFoundException;
import com.pulsedesk.kafka.event.TicketCreatedEvent;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.TicketAssigneeModal;
import com.pulsedesk.modal.TicketCommentModal;
import com.pulsedesk.modal.TicketModal;
import com.pulsedesk.repository.RoleRepository;
import com.pulsedesk.repository.TicketCommentRepository;
import com.pulsedesk.repository.TicketDetailsProjection;
import com.pulsedesk.repository.TicketRepository;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.TicketService;

@Service
public class TicketServiceImpl implements TicketService {
	private static final Set<String> VALID_STATUSES = Set.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED");
	private static final Set<String> VALID_PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH");
	private static final Set<String> VALID_SORT_FIELDS = Set.of("id", "title", "status", "priority", "assigneeId",
			"createdAt");

	@Autowired
	private TicketRepository ticketRepository;

	@Autowired
	private TicketCommentRepository ticketCommentRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private KafkaTemplate<String, TicketCreatedEvent> kafkaTemplate;

	private Logger LOGGER = LoggerFactory.getLogger(this.getClass());

	@Override
	@Transactional
	public TicketModal createTicket(TicketModal ticketModal, String email) {
		String assetIdsJson = toAssetIdsJson(ticketModal);
		UserTicketEntity user = ticketRepository.createTicket(ticketModal.getTitle(), ticketModal.getDescription(),
				ticketModal.getCategory(), ticketModal.getPriority(), email, assetIdsJson);
		LOGGER.info("entity {}", user);
		ticketModal.setRequesterId(String.valueOf(user.getId()));
		ticketModal.setTicketId(user.getTicketId());
		TicketCreatedEvent event = new TicketCreatedEvent();
		UUID eventId = UUID.randomUUID();
		event.setEventId(eventId);
		event.setOccurredAt(LocalDateTime.now());
		event.setPriority(ticketModal.getPriority());
		event.setRequesterId(user.getId());
		event.setTicketId(user.getTicketId());
		event.setTitle(ticketModal.getTitle());

		CompletableFuture<SendResult<String, TicketCreatedEvent>> future = kafkaTemplate.send("pulsedesk.ticket-events",
				eventId.toString(), event);
		future.whenComplete((result, exception) -> {
			if (exception != null) {
				LOGGER.error("Error occured: {}", exception);
			} else {
				LOGGER.info("******** Message sent successfully *********");
			}
		});
		return ticketModal;
	}

	private static String toAssetIdsJson(TicketModal ticketModal) {
		if (ticketModal.getAffectedAssetIds() == null || ticketModal.getAffectedAssetIds().isEmpty()) {
			return null;
		}

		return ticketModal.getAffectedAssetIds().stream().filter(Objects::nonNull).distinct().map(String::valueOf)
				.collect(Collectors.joining(",", "[", "]"));
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<TicketModal> getTickets(String email, int page, int size, String status, String priority,
			String sort, String direction) {
		int currentPage = Math.max(page, 0);
		int pageSize = Math.min(Math.max(size, 1), 100);
		String normalizedStatus = normalizeFilter(status, VALID_STATUSES, "status");
		String normalizedPriority = normalizeFilter(priority, VALID_PRIORITIES, "priority");
		String normalizedSort = VALID_SORT_FIELDS.contains(sort) ? sort : "createdAt";
		String normalizedDirection = "asc".equalsIgnoreCase(direction) ? "asc" : "desc";
		Pageable pageable = PageRequest.of(currentPage, pageSize);

		UserEntity user = getAuthenticatedUser(email);
		int scopeToRequester = isEmployee(user) ? 1 : 0;
		Page<TicketEntity> tickets = ticketRepository.getTickets(email, scopeToRequester, normalizedStatus,
				normalizedPriority, normalizedSort, normalizedDirection, pageable);
		Page<TicketModal> ticketModels = tickets.map(TicketServiceImpl::getTicketModal);

		return new PageResponse<>(ticketModels.getContent(), ticketModels.getNumber(), ticketModels.getSize(),
				ticketModels.getTotalElements(), ticketModels.getTotalPages(), ticketModels.isFirst(),
				ticketModels.isLast());
	}

	private static String normalizeFilter(String value, Set<String> allowedValues, String fieldName) {
		if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
			return null;
		}

		String normalizedValue = value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
		if (!allowedValues.contains(normalizedValue)) {
			throw new BadUserRequestException("Invalid ticket " + fieldName + ": " + value);
		}
		return normalizedValue;
	}

	private static TicketModal getTicketModal(TicketEntity ticketEntity) {
		TicketModal modal = new TicketModal();
		modal.setId(ticketEntity.getId());
		modal.setTitle(ticketEntity.getTitle());
		modal.setDescription(ticketEntity.getDescription());
		modal.setCategory(ticketEntity.getCategory());
		modal.setPriority(ticketEntity.getPriority());
		modal.setStatus(ticketEntity.getStatus());
		modal.setRequesterId(
				ticketEntity.getRequesterId() == null ? null : String.valueOf(ticketEntity.getRequesterId()));
		modal.setAssigneeId(ticketEntity.getAssigneeId() == null ? null : String.valueOf(ticketEntity.getAssigneeId()));
		modal.setCreatedAtTimestamp(
				ticketEntity.getCreatedAt() == null ? null : ticketEntity.getCreatedAt().toString());
		modal.setResolvedAt(ticketEntity.getResolvedAt() == null ? null : ticketEntity.getResolvedAt().toString());
		modal.setCreatedAt(ticketEntity.getCreatedAt() == null ? null
				: String.valueOf(ChronoUnit.DAYS.between(ticketEntity.getCreatedAt().toLocalDate(), LocalDate.now()))
						+ "d ago");
		return modal;
	}

	@Override
	public List<TicketModal> getAllTickets() {
		List<TicketEntity> tickets = ticketRepository.getAllTickets();
		return tickets.stream().map(TicketServiceImpl::getTicketModal).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public TicketModal getTicket(Integer ticketId, String email) {
		TicketDetailsProjection ticket = getTicketProjection(ticketId);
		authorizeTicketAccess(ticket, getAuthenticatedUser(email));
		return getTicketModal(ticket);
	}

	@Override
	@Transactional
	public TicketModal updateStatus(Integer ticketId, String status, String email) {
		requireSupportUser(getAuthenticatedUser(email));
		String normalizedStatus = normalizeFilter(status, VALID_STATUSES, "status");
		if (normalizedStatus == null) {
			throw new BadUserRequestException("Ticket status is required");
		}
		if (ticketRepository.updateTicketStatus(ticketId, normalizedStatus) != 1) {
			throw new UserNotFoundException("Ticket not found with id: " + ticketId);
		}
		return getTicketModal(getTicketProjection(ticketId));
	}

	@Override
	@Transactional
	public TicketModal updateAssignee(Integer ticketId, Integer assigneeId, String email) {
		requireSupportUser(getAuthenticatedUser(email));
		getTicketProjection(ticketId);
		if (assigneeId != null && ticketRepository.countAssignableAgent(assigneeId) != 1) {
			throw new BadUserRequestException("Assignee must be an active agent");
		}
		if (ticketRepository.updateTicketAssignee(ticketId, assigneeId) != 1) {
			throw new UserNotFoundException("Ticket not found with id: " + ticketId);
		}
		return getTicketModal(getTicketProjection(ticketId));
	}

	@Override
	@Transactional
	public TicketModal autoAssign(Integer ticketId) {
		TicketDetailsProjection ticket = getTicketProjection(ticketId);
		if (ticket.getAssigneeId() != null) {
			return getTicketModal(ticket);
		}

		Integer agentId = ticketRepository.findLeastLoadedActiveAgentId()
				.orElseThrow(() -> new BadUserRequestException("No active agent is available for assignment"));

		int updatedRows = ticketRepository.autoAssignTicketIfUnassigned(ticketId, agentId);
		TicketDetailsProjection updatedTicket = getTicketProjection(ticketId);
		if (updatedRows == 0 && updatedTicket.getAssigneeId() == null) {
			throw new BadUserRequestException("Ticket could not be auto-assigned");
		}

		return getTicketModal(updatedTicket);
	}

	@Override
	@Transactional(readOnly = true)
	public List<TicketAssigneeModal> getAssignableAgents() {
		return ticketRepository.getAssignableAgents().stream()
				.map(agent -> new TicketAssigneeModal(agent.getId(), agent.getName(), agent.getEmail())).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<TicketCommentModal> getComments(Integer ticketId, String email) {
		TicketDetailsProjection ticket = getTicketProjection(ticketId);
		authorizeTicketAccess(ticket, getAuthenticatedUser(email));
		return ticketCommentRepository.getComments(ticketId).stream()
				.map(comment -> new TicketCommentModal(comment.getId(), comment.getTicketId(), comment.getAuthorId(),
						comment.getAuthorName(), comment.getBody(), comment.getCreatedAt().toString()))
				.toList();
	}

	@Override
	@Transactional
	public void createComment(Integer ticketId, String body, String email) {
		UserEntity author = getAuthenticatedUser(email);
		TicketDetailsProjection ticket = getTicketProjection(ticketId);
		authorizeTicketAccess(ticket, author);
		if (body == null || body.isBlank()) {
			throw new BadUserRequestException("Comment cannot be empty");
		}
		String commentBody = body.trim();
		if (commentBody.length() > 4000) {
			throw new BadUserRequestException("Comment cannot exceed 4000 characters");
		}
		if (ticketCommentRepository.createComment(ticketId, author.getId(), commentBody) != 1) {
			throw new BadUserRequestException("Unable to create comment");
		}
	}

	private TicketDetailsProjection getTicketProjection(Integer ticketId) {
		if (ticketId == null) {
			throw new BadUserRequestException("Ticket id is required");
		}
		return ticketRepository.getTicketDetails(ticketId)
				.orElseThrow(() -> new UserNotFoundException("Ticket not found with id: " + ticketId));
	}

	private UserEntity getAuthenticatedUser(String email) {
		return userRepository.findByEmail(email).stream().findFirst()
				.orElseThrow(() -> new UserNotFoundException("Authenticated user was not found"));
	}

	private boolean isEmployee(UserEntity user) {
		return "employee".equalsIgnoreCase(getRole(user).getName());
	}

	private void requireSupportUser(UserEntity user) {
		String role = getRole(user).getName();
		if (!"agent".equalsIgnoreCase(role) && !"admin".equalsIgnoreCase(role)) {
			throw new AccessDeniedException("Only an agent or admin can manage tickets");
		}
	}

	private void authorizeTicketAccess(TicketDetailsProjection ticket, UserEntity user) {
		String role = getRole(user).getName();
		if ("employee".equalsIgnoreCase(role) && !user.getId().equals(ticket.getRequesterId())) {
			throw new AccessDeniedException("You cannot access another user's ticket");
		}
		if (!"employee".equalsIgnoreCase(role) && !"agent".equalsIgnoreCase(role) && !"admin".equalsIgnoreCase(role)) {
			throw new AccessDeniedException("Your role cannot access tickets");
		}
	}

	private RoleEntity getRole(UserEntity user) {
		return roleRepository.findById(user.getRoleId())
				.orElseThrow(() -> new AccessDeniedException("The authenticated user has no valid role"));
	}

	private static TicketModal getTicketModal(TicketDetailsProjection ticket) {
		TicketModal modal = new TicketModal();
		modal.setId(ticket.getId());
		modal.setTitle(ticket.getTitle());
		modal.setDescription(ticket.getDescription());
		modal.setCategory(ticket.getCategory());
		modal.setPriority(ticket.getPriority());
		modal.setStatus(TicketStatus.valueOf(ticket.getStatus()));
		modal.setRequesterId(ticket.getRequesterId() == null ? null : String.valueOf(ticket.getRequesterId()));
		modal.setRequesterName(ticket.getRequesterName());
		modal.setAssigneeId(ticket.getAssigneeId() == null ? null : String.valueOf(ticket.getAssigneeId()));
		modal.setAssigneeName(ticket.getAssigneeName());
		modal.setCreatedAtTimestamp(ticket.getCreatedAt() == null ? null : ticket.getCreatedAt().toString());
		modal.setCreatedAt(ticket.getCreatedAt() == null ? null
				: ChronoUnit.DAYS.between(ticket.getCreatedAt().toLocalDate(), LocalDate.now()) + "d ago");
		modal.setResolvedAt(ticket.getResolvedAt() == null ? null : ticket.getResolvedAt().toString());
		return modal;
	}

}

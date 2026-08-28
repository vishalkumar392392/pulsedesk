package com.pulsedesk.service.impl;

import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.entites.TicketEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.TicketModal;
import com.pulsedesk.repository.TicketRepository;
import com.pulsedesk.service.TicketService;

@Service
public class TicketServiceImpl implements TicketService {
	private static final Set<String> VALID_STATUSES = Set.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED");
	private static final Set<String> VALID_PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH");
	private static final Set<String> VALID_SORT_FIELDS = Set.of(
			"id", "title", "status", "priority", "assigneeId", "createdAt");

	@Autowired
	private TicketRepository ticketRepository;
	
	@Override
	@Transactional
	public TicketModal createTicket(TicketModal ticketModal, String email) {
		String assetIdsJson = toAssetIdsJson(ticketModal);
		UserEntity user = ticketRepository.createTicket(
				ticketModal.getTitle(),
				ticketModal.getDescription(),
				ticketModal.getCategory(),
				ticketModal.getPriority(),
				email,
				assetIdsJson);
		ticketModal.setRequesterId(String.valueOf(user.getId()));
		return ticketModal;
	}

	private static String toAssetIdsJson(TicketModal ticketModal) {
		if (ticketModal.getAffectedAssetIds() == null || ticketModal.getAffectedAssetIds().isEmpty()) {
			return null;
		}

		return ticketModal.getAffectedAssetIds().stream()
				.filter(Objects::nonNull)
				.distinct()
				.map(String::valueOf)
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

		Page<TicketEntity> tickets = ticketRepository.getTickets(
				email,
				normalizedStatus,
				normalizedPriority,
				normalizedSort,
				normalizedDirection,
				pageable);
		Page<TicketModal> ticketModels = tickets.map(TicketServiceImpl::getTicketModal);

		return new PageResponse<>(
				ticketModels.getContent(),
				ticketModels.getNumber(),
				ticketModels.getSize(),
				ticketModels.getTotalElements(),
				ticketModels.getTotalPages(),
				ticketModels.isFirst(),
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
		modal.setRequesterId(ticketEntity.getRequesterId() == null
				? null
				: String.valueOf(ticketEntity.getRequesterId()));
		modal.setAssigneeId(ticketEntity.getAssigneeId() == null
				? null
				: String.valueOf(ticketEntity.getAssigneeId()));
		modal.setCreatedAt(ticketEntity.getCreatedAt() == null
				? null
				: ticketEntity.getCreatedAt().toString());
		return modal;
	}

}

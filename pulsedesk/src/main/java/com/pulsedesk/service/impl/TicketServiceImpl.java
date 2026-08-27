package com.pulsedesk.service.impl;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.entites.TicketEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.modal.TicketModal;
import com.pulsedesk.repository.TicketRepository;
import com.pulsedesk.service.TicketService;

@Service
public class TicketServiceImpl implements TicketService {

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
	public List<TicketModal> getTickets(String email) {
		List<TicketEntity> tickets =  ticketRepository.getTickets(email);
		return tickets.stream().map(TicketServiceImpl::getTicketModal).collect(Collectors.toList());
	}
	
	private static TicketModal getTicketModal(TicketEntity ticketEntity) {
		TicketModal modal = new TicketModal();
		BeanUtils.copyProperties(ticketEntity, modal);
		return modal;
	}

}

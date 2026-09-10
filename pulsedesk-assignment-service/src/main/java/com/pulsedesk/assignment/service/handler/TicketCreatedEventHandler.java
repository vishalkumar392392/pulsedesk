package com.pulsedesk.assignment.service.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.annotation.KafkaHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.pulsedesk.assignment.service.TicketCreatedEvent;
import com.pulsedesk.assignment.service.exception.NonRetryableException;
import com.pulsedesk.assignment.service.exception.RetryableException;

@Component
@KafkaListener(topics = "pulsedesk.ticket-events")
public class TicketCreatedEventHandler {

	private Logger LOGGER = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private RestTemplate restTemplate;

	@Value("${pulsedesk.base-url}")
	private String pulsedeskBaseUrl;

	private static final String AUTO_ASSIGN_PATH = "/internal/tickets/{ticketId}/auto-assign";

	@KafkaHandler
	public void handler(@Payload TicketCreatedEvent productCreatedEvent,
			@Header(KafkaHeaders.RECEIVED_KEY) String messageKey) {

		LOGGER.info("Message key: {}", messageKey);
		LOGGER.info("ProductCreatedEvent received: {}", productCreatedEvent);

		try {
			ResponseEntity<String> response = restTemplate.exchange(pulsedeskBaseUrl + AUTO_ASSIGN_PATH,
					HttpMethod.PATCH, HttpEntity.EMPTY,
					String.class, productCreatedEvent.getTicketId());
			LOGGER.info("Ticket {} assigned successfully. Status: {}", productCreatedEvent.getTicketId(),
					response.getStatusCode());
		} catch (HttpClientErrorException exception) {
			LOGGER.error("PulseDesk rejected auto-assignment for ticket {}", productCreatedEvent.getTicketId(), exception);
			throw new NonRetryableException(exception);
		} catch (ResourceAccessException | HttpServerErrorException exception) {
			LOGGER.error("Temporary auto-assignment failure for ticket {}", productCreatedEvent.getTicketId(), exception);
			throw new RetryableException(exception);
		}

	}
}

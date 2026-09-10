package com.pulsedesk.assignment.service.kafka.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JacksonJsonDeserializer;
import org.springframework.kafka.support.serializer.JacksonJsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import com.pulsedesk.assignment.service.TicketCreatedEvent;
import com.pulsedesk.assignment.service.exception.NonRetryableException;
import com.pulsedesk.assignment.service.exception.RetryableException;

@Configuration
public class KafkaConsumerConfig {

	@Value("${spring.kafka.consumer.bootstrap-servers}")
	private String bootstrapServers;

	@Value("${spring.kafka.consumer.key-deserializer}")
	private String keyDeserializer;

	@Value("${spring.kafka.consumer.value-deserializer}")
	private String valueDeserializer;

	@Value("${spring.kafka.consumer.group-id}")
	private String groupId;

	@Bean
	ConsumerFactory<String, Object> consumerFactory() {

		Map<String, Object> config = new HashMap<>();
		config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
		config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, keyDeserializer);
		config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
		config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, valueDeserializer);

		config.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);

		// Below properties are needed as TicketCreatedEvent is present in both producer
		// and consumer in different packages
		config.put(JacksonJsonDeserializer.VALUE_DEFAULT_TYPE, TicketCreatedEvent.class.getName());
		config.put(JacksonJsonDeserializer.USE_TYPE_INFO_HEADERS, false);
		config.put(JacksonJsonDeserializer.TRUSTED_PACKAGES, "com.pulsedesk.assignment.service");

		return new DefaultKafkaConsumerFactory<>(config);
	}

	@Bean
	ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory(
			ConsumerFactory<String, Object> consumerFactory, KafkaTemplate<String, Object> kafkaTemplate) {
		DefaultErrorHandler defaultErrorHandler = new DefaultErrorHandler(
				new DeadLetterPublishingRecoverer(kafkaTemplate), new FixedBackOff(5000, 3));
		defaultErrorHandler.addNotRetryableExceptions(NonRetryableException.class);
		defaultErrorHandler.addRetryableExceptions(RetryableException.class);
		ConcurrentKafkaListenerContainerFactory<String, Object> factory = new ConcurrentKafkaListenerContainerFactory<>();
		factory.setConsumerFactory(consumerFactory);
		factory.setCommonErrorHandler(defaultErrorHandler);
		return factory;
	}

	@Bean
	KafkaTemplate<String, Object> kafkaTemplate(ProducerFactory<String, Object> producerFactory) {
		return new KafkaTemplate<>(producerFactory);
	}

	@Bean
	ProducerFactory<String, Object> producerFactory() {

		Map<String, Object> config = new HashMap<>();
		config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
		config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
		config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JacksonJsonSerializer.class);

		return new DefaultKafkaProducerFactory<>(config);
	}
}

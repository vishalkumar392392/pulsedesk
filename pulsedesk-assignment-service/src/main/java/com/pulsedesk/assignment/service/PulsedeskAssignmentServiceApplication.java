package com.pulsedesk.assignment.service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class PulsedeskAssignmentServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(PulsedeskAssignmentServiceApplication.class, args);
	}
	
	@Bean
	RestTemplate restTemplate() {
		return new RestTemplate(new JdkClientHttpRequestFactory());
	}

}

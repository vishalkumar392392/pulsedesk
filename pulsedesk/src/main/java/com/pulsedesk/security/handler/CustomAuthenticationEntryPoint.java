package com.pulsedesk.security.handler;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.pulsedesk.modal.ApiResponse;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override

	public void commence(HttpServletRequest request,

			HttpServletResponse response,

			AuthenticationException authException)

			throws IOException, ServletException {

		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

		response.setContentType(MediaType.APPLICATION_JSON_VALUE);

		ApiResponse<Object> apiResponse =

				ApiResponse.error(
						HttpServletResponse.SC_UNAUTHORIZED + "Authentication Failed" + authException.getMessage(),
						HttpStatus.UNAUTHORIZED.value());

		objectMapper.writeValue(response.getOutputStream(), apiResponse);

	}

}

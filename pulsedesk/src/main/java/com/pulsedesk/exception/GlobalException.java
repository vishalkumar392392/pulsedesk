package com.pulsedesk.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.pulsedesk.modal.ApiResponse;

@RestControllerAdvice
public class GlobalException {

	private static final Logger log = LoggerFactory.getLogger(GlobalException.class);

	@ExceptionHandler(UserNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleUserNotFound(UserNotFoundException ex) {
		log.warn("User not found: {}", ex.getMessage());
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ApiResponse.error(ex.getMessage(), HttpStatus.NOT_FOUND.value()));
	}

	@ExceptionHandler(BadUserRequestException.class)
	public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadUserRequestException ex) {
		log.warn("Bad request: {}", ex.getMessage());
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ApiResponse.error(ex.getMessage(), HttpStatus.BAD_REQUEST.value()));
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
		log.warn("Bad credentials: {}", ex.getMessage());
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(ApiResponse.error("Invalid email or password", HttpStatus.UNAUTHORIZED.value()));
	}

	@ExceptionHandler(InternalAuthenticationServiceException.class)
	public ResponseEntity<ApiResponse<Void>> handleInternalAuth(InternalAuthenticationServiceException ex) {
		Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
		log.error("Authentication service failure: {}", cause.getMessage(), cause);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse
				.error("Authentication failed due to a server error", HttpStatus.INTERNAL_SERVER_ERROR.value()));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
		log.warn("Access denied: {}", ex.getMessage());
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(ApiResponse.error("Access denied: insufficient permissions", HttpStatus.FORBIDDEN.value()));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiResponse<?>> handleBadRequest(
			HttpMessageNotReadableException ex) {
		return ResponseEntity.badRequest().body(
				ApiResponse.error("Bad Request", HttpStatus.BAD_REQUEST.value()));

	}
	
	@ExceptionHandler(    MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<?>> handleBadRequest(
		    MethodArgumentNotValidException ex) {
		return ResponseEntity.badRequest().body(
				ApiResponse.error("Bad Request", HttpStatus.BAD_REQUEST.value()));

	}
	@ExceptionHandler(    ConstraintViolationException.class)
	public ResponseEntity<ApiResponse<?>> handleBadRequest(
		    ConstraintViolationException ex) {
		return ResponseEntity.badRequest().body(
				ApiResponse.error("Bad Request", HttpStatus.BAD_REQUEST.value()));

	}
	
	@ExceptionHandler(    IllegalArgumentException.class)
	public ResponseEntity<ApiResponse<?>> handleBadRequest(
		    IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(
				ApiResponse.error("Bad Request", HttpStatus.BAD_REQUEST.value()));

	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
		log.error("Unhandled exception [{}]: {}", ex.getClass().getName(), ex.getMessage(), ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ApiResponse.error("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR.value()));
	}
}
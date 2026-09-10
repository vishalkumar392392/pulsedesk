package com.pulsedesk.assignment.service.exception;

public class NonRetryableException extends RuntimeException {

	private static final long serialVersionUID = -3458735279708450697L;

	public NonRetryableException(String message) {
		super(message);
		// TODO Auto-generated constructor stub
	}

	public NonRetryableException(Throwable cause) {
		super(cause);
		// TODO Auto-generated constructor stub
	}
}

package com.pulsedesk.assignment.service.exception;

public class RetryableException extends RuntimeException {

	private static final long serialVersionUID = -8999685246176379670L;

	public RetryableException(String message) {
		super(message);
		// TODO Auto-generated constructor stub
	}

	public RetryableException(Throwable cause) {
		super(cause);
		// TODO Auto-generated constructor stub
	}

}
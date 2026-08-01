package com.pulsedesk.exception;

public class BadUserRequestException extends RuntimeException {

	private static final long serialVersionUID = -522924920444186665L;
	
	public BadUserRequestException(String message) {
		super(message);
		
	}

}

package com.pulsedesk.modal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {

	private boolean success;
	private int statusCode;
	private String message;
	private T data;
	// null for all non-500 responses
	private String errorRef;

	public static <T> ApiResponse<T> success(T data, String message, int statusCode) {
		return new ApiResponse<>(true, statusCode, message, data, null);
	}

	public static <T> ApiResponse<T> error(String message, int statusCode) {
		return new ApiResponse<>(false, statusCode, message, null, null);
	}

	public static <T> ApiResponse<T> errorWithRef(String message, int statusCode, String errorRef) {
		return new ApiResponse<>(false, statusCode, message, null, errorRef);
	}

}

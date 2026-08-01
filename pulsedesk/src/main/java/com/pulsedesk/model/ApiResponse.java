package com.pulsedesk.model;

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
	
	 public static <T> ApiResponse<T> success(T data, String message, int statusCode) {
	        return new ApiResponse<>(true, statusCode, message, data);
	    }

	    public static <T> ApiResponse<T> error(String message, int statusCode) {
	        return new ApiResponse<>(false, statusCode, message, null);
	    }
	

}

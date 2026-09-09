package com.pulsedesk.modal;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateUserRequest {

	private String name;
	private String email;
	private String role;
	private String status;

}

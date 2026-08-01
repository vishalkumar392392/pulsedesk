package com.pulsedesk.model;

import com.pulsedesk.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserModel {
	
	private String name;
	private String email;
	private Status status;

}

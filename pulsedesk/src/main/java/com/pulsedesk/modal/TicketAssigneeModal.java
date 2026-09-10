package com.pulsedesk.modal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TicketAssigneeModal {

	private Integer id;
	private String name;
	private String email;
}

package com.pulsedesk.modal;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateTicketStatusRequest {

	private String status;
}

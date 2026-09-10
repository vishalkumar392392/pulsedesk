package com.pulsedesk.modal;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AssetsModal {

	private Integer id;
	private String tag;
	private String type;
	private String model;
	private String status;
	private Integer assignedToId;
	private String assignedTo;

	private String purchasedAt;

	private String coverageUntil;

}

package com.pulsedesk.modal;

import java.time.LocalDate;

import lombok.Data;

@Data
public class CreateAssetRequest {

	private String tag;
	private String type;
	private String model;
	private LocalDate purchasedAt;
	private LocalDate coverageUntil;

}

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

}

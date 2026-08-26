package com.pulsedesk.entites;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class AssetsEntity {
	
	@Id
	private Integer id;
	private String tag;
	private String type;
	private String model;

}

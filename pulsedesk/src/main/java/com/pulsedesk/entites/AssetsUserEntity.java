package com.pulsedesk.entites;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class AssetsUserEntity {

	@Id
	private Integer id;
	private String tag;
	private String type;
	private String model;
	private String status;
	@Column(name = "assigned_to_id")
	private Integer assignedToId;
	@Column(name = "name")
	private String assignedTo;
	
	@Column(name = "purchased_at")
	private String purchasedAt;
	
	@Column(name = "coverage_until")
	private String coverageUntil;

}

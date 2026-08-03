package com.pulsedesk.entites;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class RoleUserEntity {
	
	@Id
	@Column(name = "user_id")
	private Integer userId;
	
	@Column(name = "name")
	private String roleName;
	
	@Column(name = "id")
	private Integer roleId;

}

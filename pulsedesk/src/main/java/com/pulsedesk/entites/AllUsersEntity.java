package com.pulsedesk.entites;

import com.pulsedesk.enums.Status;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Data
public class AllUsersEntity {

	@Id
	@Column(name = "user_id")
	private Integer id;

	private String name;

	private String email;

	@Column(name = "mobile_number")
	private String mobileNumber;

	@Column(name = "create_dt")
	private String createDt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Status status;

	@Column(name = "role")
	private String role;

}

package com.pulsedesk.entites;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;

@Entity
@Data
@Table(name = "users")
public class UserEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "user_id")
	private Integer id;

	private String name;

	private String email;

	@Column(name = "mobile_number")
	private String mobileNumber;

	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	private String pwd;

	@Column(name = "create_dt")
	private String createDt;

	@JsonIgnore
	@ManyToMany(fetch = FetchType.EAGER)
	@JoinTable(name = "student_role", joinColumns = @JoinColumn(name="student_id"), inverseJoinColumns = @JoinColumn(name="role_id"))
	private Set<Role> roles;
	

	@Transient
	private String jwtToken;

}
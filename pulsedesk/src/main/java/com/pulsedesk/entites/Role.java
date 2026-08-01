package com.pulsedesk.entites;

import java.util.Set;

import org.springframework.security.core.GrantedAuthority;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Data
@EqualsAndHashCode(exclude = "userEntites")
@ToString(exclude = "userEntites")
public class Role implements GrantedAuthority {

	private static final long serialVersionUID = 5569737971709284000L;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;
	
	@ManyToMany(mappedBy = "roles")
	private Set<UserEntity> userEntites;

	@Override
	public String getAuthority() {
		return name;
	}

}

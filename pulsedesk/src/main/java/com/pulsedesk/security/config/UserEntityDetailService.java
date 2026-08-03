package com.pulsedesk.security.config;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.pulsedesk.entites.RoleEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.repository.RoleRepository;
import com.pulsedesk.repository.UserRepository;

@Service
public class UserEntityDetailService implements UserDetailsService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RoleRepository roleRepository;

	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

		List<UserEntity> users = userRepository.findByEmail(email);

		if (users == null || users.isEmpty()) {
			throw new UsernameNotFoundException("User details not found for the user: " + email);
		}
		UserEntity user = users.get(0);
		RoleEntity role = roleRepository.findById(user.getRoleId())
				.orElseThrow(() -> new UsernameNotFoundException("Role not found for user: " + email));
		return new User(user.getEmail(), user.getPwd(),
				Collections.singletonList(new SimpleGrantedAuthority(role.getName())));
	}

}

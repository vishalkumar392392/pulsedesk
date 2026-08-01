package com.pulsedesk.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pulsedesk.entites.Role;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.model.RegisterRequest;
import com.pulsedesk.repository.RoleRepository;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.UserService;

@Service
public class UserServiceImpl implements UserService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private PasswordEncoder encoder;

	@Override
	public UserEntity save(RegisterRequest request) {

		List<UserEntity> existing = userRepository.findByEmail(request.getEmail());
		if (Objects.nonNull(existing) && !existing.isEmpty()) {
			throw new BadUserRequestException("EmailId is already registered..");
		}

		Role role = roleRepository.findByName(request.getRole())
				.orElseThrow(() -> new BadUserRequestException(
						"Invalid role '" + request.getRole() + "'. Allowed: admin, employee, agent"));

		UserEntity user = new UserEntity();
		user.setName(request.getName());
		user.setEmail(request.getEmail());
		user.setMobileNumber(request.getMobileNumber());
		user.setPwd(encoder.encode(request.getPwd()));
		user.setCreateDt(LocalDateTime.now().toString());
		user.setRoles(Set.of(role));

		return userRepository.save(user);
	}

}

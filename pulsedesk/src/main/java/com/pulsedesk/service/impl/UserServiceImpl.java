package com.pulsedesk.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pulsedesk.entites.RoleEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.enums.Status;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.modal.RegisterRequest;
import com.pulsedesk.modal.UserModel;
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

		RoleEntity role = roleRepository.findByName(request.getRole()).orElseThrow(() -> new BadUserRequestException(
				"Invalid role '" + request.getRole() + "'. Allowed: admin, employee, agent"));

		UserEntity user = new UserEntity();
		user.setName(request.getName());
		user.setEmail(request.getEmail());
		user.setMobileNumber(request.getMobileNumber());
		user.setPwd(encoder.encode(request.getPwd()));
		user.setCreateDt(LocalDateTime.now().toString());
		user.setRoleId(role.getId());
		user.setStatus(Status.ACTIVE);

		return userRepository.save(user);
	}

	@Override
	public List<UserModel> getAllUsers() {
		List<UserEntity> userEntites = userRepository.findAll();
		List<UserModel> users = new ArrayList<>();
		List<RoleEntity> roles = roleRepository.findAll();
		for (UserEntity entity : userEntites) {
			UserModel userModel = new UserModel();
			BeanUtils.copyProperties(entity, userModel);
			userModel.setRole(roles.stream().filter(i -> entity.getRoleId().equals(i.getId())).map(RoleEntity::getName)
					.findFirst().orElse(""));

			users.add(userModel);
		}
		return users;
	}

	@Override
	public UserModel getByUserId(Integer id) {
		UserEntity user = userRepository.findById(id).get();
		UserModel userResponse = new UserModel();
		BeanUtils.copyProperties(user, userResponse);
		roleRepository.findById(user.getRoleId()).ifPresent(role -> userResponse.setRole(role.getName()));
		return userResponse;
	}

	@Override
	public UserModel getByUserEmail(String email) {
		UserEntity user = userRepository.findByEmail(email).get(0);
		UserModel userResponse = new UserModel();
		BeanUtils.copyProperties(user, userResponse);
		roleRepository.findById(user.getRoleId()).ifPresent(role -> userResponse.setRole(role.getName()));
		return userResponse;
	}

}

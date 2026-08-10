package com.pulsedesk.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pulsedesk.entites.AllUsersEntity;
import com.pulsedesk.entites.RoleEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.enums.Status;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.RegisterRequest;
import com.pulsedesk.modal.UserModel;
import com.pulsedesk.repository.GetAllUsersRepository;
import com.pulsedesk.repository.RoleRepository;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.UserService;

@Service
public class UserServiceImpl implements UserService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private GetAllUsersRepository allUsersRepository;

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

	@Override
	public PageResponse<UserModel> getAllUsers(int page, int size, String role) {
		int currentPage = Math.max(page, 0);
		int pageSize = Math.min(Math.max(size, 1), 100);
		Pageable pageable = PageRequest.of(currentPage, pageSize);
		Page<AllUsersEntity> users = allUsersRepository.findUsers(role, pageable);
		Page<UserModel> userModels = users.map(this::convertToUserModel);
		return new PageResponse<>(userModels.getContent(), userModels.getNumber(), userModels.getSize(),
				userModels.getTotalElements(), userModels.getTotalPages(), userModels.isFirst(), userModels.isLast());

	}

	private UserModel convertToUserModel(AllUsersEntity entity) {

		UserModel model = new UserModel();
		model.setId(entity.getId());
		model.setName(entity.getName());
		model.setEmail(entity.getEmail());
		model.setMobileNumber(entity.getMobileNumber());
		model.setStatus(entity.getStatus());
		model.setRole(entity.getRole());
		return model;

	}

}

package com.pulsedesk.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Locale;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.entites.AllUsersEntity;
import com.pulsedesk.entites.RoleEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.enums.Status;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.exception.UserNotFoundException;
import com.pulsedesk.modal.ChangePasswordRequest;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.RegisterRequest;
import com.pulsedesk.modal.UpdateProfileRequest;
import com.pulsedesk.modal.UserModel;
import com.pulsedesk.modal.UpdateUserRequest;
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
	@Transactional
	public UserModel updateUser(Integer id, UpdateUserRequest request) {
		if (request == null) {
			throw new BadUserRequestException("User update request is required");
		}

		String name = requireValue(request.getName(), "Name");
		String email = requireValue(request.getEmail(), "Email").toLowerCase(Locale.ROOT);
		String roleName = requireValue(request.getRole(), "Role").toLowerCase(Locale.ROOT);
		String statusValue = requireValue(request.getStatus(), "Status").toUpperCase(Locale.ROOT);

		if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
			throw new BadUserRequestException("Invalid email address");
		}

		UserEntity user = userRepository.findById(id)
				.orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

		boolean emailBelongsToAnotherUser = userRepository.findByEmail(email).stream()
				.anyMatch(existingUser -> !existingUser.getId().equals(id));
		if (emailBelongsToAnotherUser) {
			throw new BadUserRequestException("Email is already registered to another user");
		}

		RoleEntity role = roleRepository.findByName(roleName)
				.orElseThrow(() -> new BadUserRequestException(
						"Invalid role '" + request.getRole() + "'. Allowed: admin, employee, agent"));

		Status status;
		try {
			status = Status.valueOf(statusValue);
		} catch (IllegalArgumentException exception) {
			throw new BadUserRequestException(
					"Invalid status '" + request.getStatus() + "'. Allowed: ACTIVE, INACTIVE");
		}

		user.setName(name);
		user.setEmail(email);
		user.setRoleId(role.getId());
		user.setStatus(status);
		UserEntity savedUser = userRepository.save(user);

		UserModel model = new UserModel();
		BeanUtils.copyProperties(savedUser, model);
		model.setRole(role.getName());
		return model;
	}

	@Override
	@Transactional
	public UserModel updateCurrentUserProfile(String email, UpdateProfileRequest request) {
		if (request == null) {
			throw new BadUserRequestException("Profile update request is required");
		}

		String name = requireValue(request.getName(), "Name");
		if (name.length() < 2) {
			throw new BadUserRequestException("Name must contain at least 2 characters");
		}

		UserEntity user = getCurrentUser(email);
		user.setName(name);
		return toUserModel(userRepository.save(user));
	}

	@Override
	@Transactional
	public void changeCurrentUserPassword(String email, ChangePasswordRequest request) {
		if (request == null) {
			throw new BadUserRequestException("Password update request is required");
		}

		String currentPassword = requirePassword(request.getCurrentPassword(), "Current password");
		String newPassword = requirePassword(request.getNewPassword(), "New password");
		String confirmPassword = requirePassword(request.getConfirmPassword(), "Confirm password");

		if (newPassword.length() < 6) {
			throw new BadUserRequestException("New password must be at least 6 characters");
		}
		if (!newPassword.equals(confirmPassword)) {
			throw new BadUserRequestException("New password and confirmation do not match");
		}

		UserEntity user = getCurrentUser(email);
		if (!encoder.matches(currentPassword, user.getPwd())) {
			throw new BadUserRequestException("Current password is incorrect");
		}
		if (encoder.matches(newPassword, user.getPwd())) {
			throw new BadUserRequestException("New password must be different from the current password");
		}

		user.setPwd(encoder.encode(newPassword));
		userRepository.save(user);
	}

	private UserEntity getCurrentUser(String email) {
		return userRepository.findByEmail(email).stream().findFirst()
				.orElseThrow(() -> new UserNotFoundException("User not found for the authenticated account"));
	}

	private UserModel toUserModel(UserEntity user) {
		UserModel model = new UserModel();
		BeanUtils.copyProperties(user, model);
		roleRepository.findById(user.getRoleId()).ifPresent(role -> model.setRole(role.getName()));
		return model;
	}

	private static String requireValue(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new BadUserRequestException(fieldName + " is required");
		}
		return value.trim();
	}

	private static String requirePassword(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new BadUserRequestException(fieldName + " is required");
		}
		return value;
	}

	@Override
	public PageResponse<UserModel> getAllUsers(int page, int size, String role, String sort, String direction) {
		int currentPage = Math.max(page, 0);
		int pageSize = Math.min(Math.max(size, 1), 100);
		Pageable pageable = PageRequest.of(currentPage, pageSize);
		Page<AllUsersEntity> users = allUsersRepository.findUsers(role, sort, direction,pageable);
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

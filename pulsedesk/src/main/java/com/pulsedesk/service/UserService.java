package com.pulsedesk.service;

import java.util.List;

import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.RegisterRequest;
import com.pulsedesk.modal.UserModel;
import com.pulsedesk.modal.UpdateUserRequest;

public interface UserService {

	public UserEntity save(RegisterRequest request) throws BadUserRequestException;

	public List<UserModel> getAllUsers();

	public UserModel getByUserId(Integer id);

	public UserModel getByUserEmail(String email);

	UserModel updateUser(Integer id, UpdateUserRequest request);

	PageResponse<UserModel>  getAllUsers(int page, int size, String role, String sort, String direction

	);

}

package com.pulsedesk.service;

import java.util.List;

import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.modal.RegisterRequest;
import com.pulsedesk.modal.UserModel;

public interface UserService {

	public UserEntity save(RegisterRequest request) throws BadUserRequestException;

	public List<UserModel> getAllUsers();

	public UserModel getByUserId(Integer id);

	public UserModel getByUserEmail(String email);

}

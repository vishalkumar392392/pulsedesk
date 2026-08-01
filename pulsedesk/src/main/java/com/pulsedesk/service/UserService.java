package com.pulsedesk.service;

import java.util.List;

import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.model.RegisterRequest;
import com.pulsedesk.model.UserModel;

public interface UserService {

	public UserEntity save(RegisterRequest request) throws BadUserRequestException;

	public List<UserModel> getAllUsers();

}

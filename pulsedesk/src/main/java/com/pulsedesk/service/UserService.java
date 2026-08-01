package com.pulsedesk.service;

import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.model.RegisterRequest;

public interface UserService {

	public UserEntity save(RegisterRequest request) throws BadUserRequestException;

}

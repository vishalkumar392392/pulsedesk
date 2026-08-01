package com.pulsedesk.service;


import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.exception.BadUserRequestException;

public interface UserService {

	public UserEntity save(UserEntity user) throws BadUserRequestException;

}

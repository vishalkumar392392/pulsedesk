package com.pulsedesk.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.UserService;

@Service
public class UserServiceImpl implements UserService{
	
	
	@Autowired
	private UserRepository userRepository;
	
	@Autowired
	private PasswordEncoder encoder;

	@Override
	public UserEntity save(UserEntity user) {
		
		List<UserEntity> users = userRepository.findByEmail(user.getEmail());
		if(Objects.nonNull(users) && users.size() > 0) {
			throw new BadUserRequestException("EmailId is already registered..");
		}
		user.setPwd(encoder.encode(user.getPwd()));
		user.setCreateDt(LocalDateTime.now().toString());
		
		return userRepository.save(user);
	}

}

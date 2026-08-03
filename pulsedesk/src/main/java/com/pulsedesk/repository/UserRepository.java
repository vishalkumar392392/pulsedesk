package com.pulsedesk.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pulsedesk.entites.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
	
	List<UserEntity> findByEmail(String email);

	UserEntity getByEmail(String email);

}

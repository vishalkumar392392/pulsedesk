package com.pulsedesk.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pulsedesk.entites.AllUsersEntity;

public interface GetAllUsersRepository extends JpaRepository<AllUsersEntity, Integer> {
	
	
	@Query(value = """
			SELECT u.user_id, u.name,
			u.email, u.mobile_number,
			u.create_dt, u.status, r.name as role
			FROM users u
			JOIN role r ON r.id = u.role_id
			WHERE (:role IS NULL OR r.name = :role)
			""",
			countQuery = """
			SELECT COUNT(*)
			FROM users u
			JOIN role r ON r.id = u.role_id
			WHERE (:role IS NULL OR r.name = :role)
			""", nativeQuery = true)

	Page<AllUsersEntity> findUsers(@Param("role") String role, Pageable pageable);

}

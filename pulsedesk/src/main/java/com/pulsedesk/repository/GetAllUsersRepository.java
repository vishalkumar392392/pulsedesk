package com.pulsedesk.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pulsedesk.entites.AllUsersEntity;

public interface GetAllUsersRepository extends JpaRepository<AllUsersEntity, Integer> {

	@Query(value = """
			SELECT
			    u.user_id,
			    u.name,
			    u.email,
			    u.mobile_number,
			    u.create_dt,
			    u.status,
			    r.name AS role
			FROM users u
			JOIN role r ON r.id = u.role_id
			WHERE (:role IS NULL OR r.name = :role)
			ORDER BY
			    CASE
			        WHEN :sort = 'name' AND :direction = 'asc'
			        THEN u.name
			    END ASC,

			    CASE
			        WHEN :sort = 'name' AND :direction = 'desc'
			        THEN u.name
			    END DESC,

			    CASE
			        WHEN :sort = 'email' AND :direction = 'asc'
			        THEN u.email
			    END ASC,

			    CASE
			        WHEN :sort = 'email' AND :direction = 'desc'
			        THEN u.email
			    END DESC,

			    CASE
			        WHEN :sort = 'status' AND :direction = 'asc'
			        THEN u.status
			    END ASC,

			    CASE
			        WHEN :sort = 'status' AND :direction = 'desc'
			        THEN u.status
			    END DESC,

			    CASE
			        WHEN :sort = 'create_dt' AND :direction = 'asc'
			        THEN u.create_dt
			    END ASC,

			    CASE
			        WHEN :sort = 'create_dt' AND :direction = 'desc'
			        THEN u.create_dt
			    END DESC,

			    CASE
			        WHEN :sort = 'role' AND :direction = 'asc'
			        THEN r.name
			    END ASC,

			    CASE
			        WHEN :sort = 'role' AND :direction = 'desc'
			        THEN r.name
			    END DESC,

			    u.user_id ASC
			""",

			countQuery = """
					SELECT COUNT(*)
					FROM users u
					JOIN role r ON r.id = u.role_id
					WHERE (:role IS NULL OR r.name = :role)
					""", nativeQuery = true)
	Page<AllUsersEntity> findUsers(@Param("role") String role, @Param("sort") String sort,
			@Param("direction") String direction, Pageable pageable);
}
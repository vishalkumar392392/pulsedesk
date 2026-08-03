package com.pulsedesk.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pulsedesk.entites.RoleEntity;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {

	Optional<RoleEntity> findByName(String name);

	@Query(value = """
	        SELECT r.*
	        FROM role r
	        INNER JOIN user_role ur
	            ON r.id = ur.role_id
	        WHERE ur.user_id = :userId
	        """, nativeQuery = true)
	    List<RoleEntity> findRolesByUserId(@Param("userId") String userId);

}

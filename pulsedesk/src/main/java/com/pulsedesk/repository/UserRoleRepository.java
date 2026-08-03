package com.pulsedesk.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.pulsedesk.entites.RoleUserEntity;

public interface UserRoleRepository extends JpaRepository<RoleUserEntity, Integer> {

	@Query(value = """
			SELECT
				ur.user_id,
				r.name,
				r.id
				FROM user_role ur
				JOIN role r
				    ON ur.role_id = r.id
				ORDER BY ur.user_id;
					        """, nativeQuery = true)
	List<RoleUserEntity> getAllUsersAndTheirRoles();
}

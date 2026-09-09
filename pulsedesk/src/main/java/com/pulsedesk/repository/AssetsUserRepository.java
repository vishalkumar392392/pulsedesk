package com.pulsedesk.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pulsedesk.entites.AssetsUserEntity;

public interface AssetsUserRepository extends JpaRepository<AssetsUserEntity, Integer> {

	@Query(value = """
			SELECT
			    a.id,
			    a.tag,
			    a.type,
			    a.model,
			    a.status,
			    u.name
			FROM assets a
			JOIN users u ON u.user_id = a.assigned_to_id
			AND (:status IS NULL OR a.status = :status)
			  AND (:type IS NULL OR a.type = :type)
			""", nativeQuery = true)
	List<AssetsUserEntity> getAllAssets(@Param("status") String status, @Param("type") String type);

}

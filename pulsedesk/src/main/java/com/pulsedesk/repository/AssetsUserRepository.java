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
			    a.assigned_to_id,
			    a.purchased_at,
			    a.coverage_until,
			    u.name
			FROM assets a
			LEFT JOIN users u ON u.user_id = a.assigned_to_id
			WHERE (:status IS NULL OR a.status = :status)
			  AND (:type IS NULL OR a.type = :type)
			ORDER BY a.tag ASC
			""", nativeQuery = true)
	List<AssetsUserEntity> getAllAssets(@Param("status") String status, @Param("type") String type);

	@Query(value = """
			SELECT
			    a.id,
			    a.tag,
			    a.type,
			    a.model,
			    a.status,
			    a.assigned_to_id,
			    a.purchased_at,
			    a.coverage_until,
			    u.name
			FROM assets a
			LEFT JOIN users u ON u.user_id = a.assigned_to_id
			WHERE a.id = :assetId
			""", nativeQuery = true)
	java.util.Optional<AssetsUserEntity> getAssetById(@Param("assetId") Integer assetId);

}

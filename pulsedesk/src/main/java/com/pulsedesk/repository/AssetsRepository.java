package com.pulsedesk.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pulsedesk.entites.AssetsEntity;

public interface AssetsRepository extends JpaRepository<AssetsEntity, Integer> {

	@Query(value = "select a.id, a.tag, a.type, a.model from assets a", nativeQuery = true)
	List<AssetsEntity> getAssets();

	@Query(value = """
			SELECT
			    a.id,
			    a.tag,
			    a.type,
			    a.model
			FROM assets a
			JOIN users u ON u.user_id = a.assigned_to_id
			WHERE u.email = :email
			""", nativeQuery = true)
	List<AssetsEntity> getAssetsByEmail(@Param("email") String email);

}

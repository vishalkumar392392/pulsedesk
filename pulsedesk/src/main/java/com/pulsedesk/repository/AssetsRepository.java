package com.pulsedesk.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

	@Query(value = """
			SELECT
			    a.id AS id,
			    a.assigned_to_id AS assignedToId,
			    a.status AS status
			FROM assets a
			WHERE a.id = :assetId
			""", nativeQuery = true)
	Optional<AssetAssignmentState> getAssignmentState(@Param("assetId") Integer assetId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query(value = """
			UPDATE assets
			SET assigned_to_id = :assignedToId,
			    status = :status
			WHERE id = :assetId
			""", nativeQuery = true)
	int updateAssignment(@Param("assetId") Integer assetId, @Param("assignedToId") Integer assignedToId,
			@Param("status") String status);

	@Modifying
	@Query(value = """
			UPDATE asset_assignment_history
			SET unassigned_at = CURRENT_TIMESTAMP(6),
			    unassigned_by_id = :changedById
			WHERE asset_id = :assetId
			  AND unassigned_at IS NULL
			""", nativeQuery = true)
	int closeActiveAssignment(@Param("assetId") Integer assetId, @Param("changedById") Integer changedById);

	@Modifying
	@Query(value = """
			INSERT INTO asset_assignment_history
			    (asset_id, assigned_to_id, assigned_by_id, assigned_at)
			VALUES
			    (:assetId, :assignedToId, :changedById, CURRENT_TIMESTAMP(6))
			""", nativeQuery = true)
	int createAssignmentHistory(@Param("assetId") Integer assetId,
			@Param("assignedToId") Integer assignedToId, @Param("changedById") Integer changedById);

}

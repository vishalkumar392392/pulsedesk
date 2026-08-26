package com.pulsedesk.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.pulsedesk.entites.AssetsEntity;

public interface AssetsRepository extends JpaRepository<AssetsEntity, Integer> {

	@Query(value="select a.id, a.tag, a.type, a.model from assets a", nativeQuery = true)
	List<AssetsEntity> getAssets();

}

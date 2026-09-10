package com.pulsedesk.service.impl;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pulsedesk.entites.AssetsEntity;
import com.pulsedesk.entites.AssetsUserEntity;
import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.enums.Status;
import com.pulsedesk.exception.BadUserRequestException;
import com.pulsedesk.exception.UserNotFoundException;
import com.pulsedesk.modal.AssetAssigneeModal;
import com.pulsedesk.modal.AssetsModal;
import com.pulsedesk.repository.AssetAssignmentState;
import com.pulsedesk.repository.AssetsRepository;
import com.pulsedesk.repository.AssetsUserRepository;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.AssetService;

@Service
public class AssetServiceImpl implements AssetService {

	@Autowired
	private AssetsRepository assetsRepository;

	@Autowired
	private AssetsUserRepository assetsUserRepository;

	@Autowired
	private UserRepository userRepository;
	
	@Override
	public List<AssetsModal> getAssets() {

		List<AssetsEntity> assets = assetsRepository.getAssets();
		return assets.stream().map(AssetServiceImpl::getAssetModal).collect(Collectors.toList());
	}

	private static AssetsModal getAssetModal(AssetsEntity entity) {
		AssetsModal modal = new AssetsModal();
		BeanUtils.copyProperties(entity, modal);
		return modal;
	}
	
	private static AssetsModal getAssetUserModal(AssetsUserEntity entity) {
		AssetsModal modal = new AssetsModal();
		BeanUtils.copyProperties(entity, modal);
		return modal;
	}

	@Override
	public List<AssetsModal> getAssetsByEmail(String email) {
		List<AssetsEntity> assets = assetsRepository.getAssetsByEmail(email);
		return assets.stream().map(AssetServiceImpl::getAssetModal).collect(Collectors.toList());

	}

	@Override
	public List<AssetsModal> getAllAssets(String status, String type) {
		List<AssetsUserEntity> assets = assetsUserRepository.getAllAssets(status, type);
		return assets.stream().map(AssetServiceImpl::getAssetUserModal).collect(Collectors.toList());
	}

	@Override
	public List<AssetAssigneeModal> getAssetAssignees() {
		return userRepository.findAllByStatusOrderByNameAsc(Status.ACTIVE).stream()
				.map(user -> new AssetAssigneeModal(user.getId(), user.getName(), user.getEmail()))
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public AssetsModal assignAsset(Integer assetId, Integer assignedToId, String changedByEmail) {
		AssetAssignmentState asset = assetsRepository.getAssignmentState(assetId)
				.orElseThrow(() -> new UserNotFoundException("Asset not found with id: " + assetId));

		if ("RETIRED".equals(asset.getStatus())) {
			throw new BadUserRequestException("A retired asset cannot be assigned");
		}

		UserEntity changedBy = userRepository.findByEmail(changedByEmail).stream().findFirst()
				.orElseThrow(() -> new UserNotFoundException("Authenticated user was not found"));

		if (assignedToId != null) {
			UserEntity assignee = userRepository.findById(assignedToId)
					.orElseThrow(() -> new UserNotFoundException("User not found with id: " + assignedToId));
			if (assignee.getStatus() != Status.ACTIVE) {
				throw new BadUserRequestException("Assets can only be assigned to active users");
			}
		}

		if (!Objects.equals(asset.getAssignedToId(), assignedToId)) {
			assetsRepository.closeActiveAssignment(assetId, changedBy.getId());
			assetsRepository.updateAssignment(assetId, assignedToId, assignedToId == null ? "IN_STOCK" : "IN_USE");

			if (assignedToId != null) {
				assetsRepository.createAssignmentHistory(assetId, assignedToId, changedBy.getId());
			}
		}

		return assetsUserRepository.getAssetById(assetId).map(AssetServiceImpl::getAssetUserModal)
				.orElseThrow(() -> new UserNotFoundException("Asset not found with id: " + assetId));
	}

	

}

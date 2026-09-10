package com.pulsedesk.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
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
import com.pulsedesk.modal.CreateAssetRequest;
import com.pulsedesk.repository.AssetAssignmentState;
import com.pulsedesk.repository.AssetsRepository;
import com.pulsedesk.repository.AssetsUserRepository;
import com.pulsedesk.repository.UserRepository;
import com.pulsedesk.service.AssetService;

@Service
public class AssetServiceImpl implements AssetService {

	private static final Set<String> ASSET_TYPES = Set.of("LAPTOP", "MONITOR", "PHONE", "KEYBOARD", "DOCK",
			"LICENSE");

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
	public AssetsModal createAsset(CreateAssetRequest request) {
		if (request == null) {
			throw new BadUserRequestException("Asset request is required");
		}

		String tag = requireValue(request.getTag(), "Asset tag").toUpperCase(Locale.ROOT);
		String type = requireValue(request.getType(), "Asset type").toUpperCase(Locale.ROOT).replace(' ', '_');
		String model = requireValue(request.getModel(), "Asset model");
		LocalDate purchasedAt = request.getPurchasedAt();
		LocalDate coverageUntil = request.getCoverageUntil();

		if (tag.length() > 30) {
			throw new BadUserRequestException("Asset tag must not exceed 30 characters");
		}
		if (model.length() > 100) {
			throw new BadUserRequestException("Asset model must not exceed 100 characters");
		}
		if (!ASSET_TYPES.contains(type)) {
			throw new BadUserRequestException("Invalid asset type: " + request.getType());
		}
		if (purchasedAt == null) {
			throw new BadUserRequestException("Purchased date is required");
		}
		if (coverageUntil != null && coverageUntil.isBefore(purchasedAt)) {
			throw new BadUserRequestException("Coverage date cannot be before the purchased date");
		}
		if (assetsRepository.countByTag(tag) > 0) {
			throw new BadUserRequestException("An asset with tag '" + tag + "' already exists");
		}

		try {
			assetsRepository.createAsset(tag, type, model, purchasedAt, coverageUntil);
		} catch (DataIntegrityViolationException ex) {
			throw new BadUserRequestException("Asset could not be created because its values conflict with existing data");
		}

		return assetsUserRepository.getAssetByTag(tag).map(AssetServiceImpl::getAssetUserModal)
				.orElseThrow(() -> new UserNotFoundException("Created asset could not be loaded"));
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

	private static String requireValue(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new BadUserRequestException(fieldName + " is required");
		}
		return value.trim();
	}

	

}

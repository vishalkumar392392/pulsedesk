package com.pulsedesk.service;

import java.util.List;

import com.pulsedesk.modal.AssetAssigneeModal;
import com.pulsedesk.modal.AssetsModal;

public interface AssetService {

	List<AssetsModal>  getAssets();

	List<AssetsModal> getAssetsByEmail(String email);

	List<AssetsModal> getAllAssets(String status, String type);

	List<AssetAssigneeModal> getAssetAssignees();

	AssetsModal assignAsset(Integer assetId, Integer assignedToId, String changedByEmail);

}

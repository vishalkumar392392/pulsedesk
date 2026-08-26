package com.pulsedesk.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pulsedesk.entites.AssetsEntity;
import com.pulsedesk.modal.AssetsModal;
import com.pulsedesk.repository.AssetsRepository;
import com.pulsedesk.service.AssetService;

@Service
public class AssetServiceImpl implements AssetService {

	@Autowired
	private AssetsRepository assetsRepository;

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

	@Override
	public List<AssetsModal> getAssetsByEmail(String email) {
		List<AssetsEntity> assets = assetsRepository.getAssetsByEmail(email);
		return assets.stream().map(AssetServiceImpl::getAssetModal).collect(Collectors.toList());

	}

}

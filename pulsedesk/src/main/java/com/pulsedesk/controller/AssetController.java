package com.pulsedesk.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.modal.ApiResponse;
import com.pulsedesk.modal.AssetsModal;
import com.pulsedesk.service.AssetService;
import java.security.Principal;
@RestController
@RequestMapping("/assets")
public class AssetController {

	@Autowired
	private AssetService assetService;

	@GetMapping
	public ResponseEntity<ApiResponse<List<AssetsModal>>> getAssets() {
		List<AssetsModal> assets = assetService.getAssets();
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(assets, "Fetched assets successfully", HttpStatus.OK.value()));
	}
	
	@GetMapping("/mine")
	public ResponseEntity<ApiResponse<List<AssetsModal>>> getEmployeeAssets(Principal principal) {
		
		String email = principal.getName();
		List<AssetsModal> assets = assetService.getAssetsByEmail(email);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(assets, "Fetched assets successfully", HttpStatus.OK.value()));
	}

}

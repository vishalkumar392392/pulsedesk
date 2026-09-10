package com.pulsedesk.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.modal.ApiResponse;
import com.pulsedesk.modal.AssignAssetRequest;
import com.pulsedesk.modal.AssetAssigneeModal;
import com.pulsedesk.modal.AssetsModal;
import com.pulsedesk.modal.CreateAssetRequest;
import com.pulsedesk.service.AssetService;

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

	@GetMapping("/all")
	@PreAuthorize("hasAnyAuthority('agent', 'admin')")
	public ResponseEntity<ApiResponse<List<AssetsModal>>> getAllAssets(@RequestParam(required = false) String status,
			@RequestParam(required = false) String type) {
		List<AssetsModal> assets = assetService.getAllAssets(status, type);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(assets, "Fetched assets successfully", HttpStatus.OK.value()));
	}

	@GetMapping("/assignees")
	@PreAuthorize("hasAnyAuthority('agent', 'admin')")
	public ResponseEntity<ApiResponse<List<AssetAssigneeModal>>> getAssetAssignees() {
		List<AssetAssigneeModal> users = assetService.getAssetAssignees();
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(users, "Fetched asset assignees successfully", HttpStatus.OK.value()));
	}

	@PostMapping
	@PreAuthorize("hasAnyAuthority('agent', 'admin')")
	public ResponseEntity<ApiResponse<AssetsModal>> createAsset(@RequestBody CreateAssetRequest request) {
		AssetsModal asset = assetService.createAsset(request);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success(asset, "Asset created successfully", HttpStatus.CREATED.value()));
	}

	@PatchMapping("/{assetId}/assign")
	@PreAuthorize("hasAnyAuthority('agent', 'admin')")
	public ResponseEntity<ApiResponse<AssetsModal>> assignAsset(@PathVariable Integer assetId,
			@RequestBody AssignAssetRequest request, Principal principal) {
		AssetsModal asset = assetService.assignAsset(assetId, request.getAssignedToId(), principal.getName());
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(asset, "Asset assignment updated successfully", HttpStatus.OK.value()));
	}

}

package com.pulsedesk.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;

import com.pulsedesk.modal.ApiResponse;
import com.pulsedesk.modal.PageResponse;
import com.pulsedesk.modal.UserModel;
import com.pulsedesk.modal.UpdateUserRequest;
import com.pulsedesk.service.UserService;

@RestController
@RequestMapping("/user")
public class UserController {

	@Autowired
	private UserService userService;

	@GetMapping("/all")
	@PreAuthorize("hasAuthority('admin')")
	public ResponseEntity<ApiResponse<PageResponse<UserModel>>> getAllUsers(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "25") int size, @RequestParam(required = false) String role,
			@RequestParam(defaultValue = "name") String sort,
			@RequestParam(defaultValue = "asc") String direction) {
		PageResponse<UserModel> users = userService.getAllUsers(page, size, role,sort, direction);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(users, "Fetched users successfully", HttpStatus.OK.value()));

	}

	@GetMapping("id/{userId}")
	@PreAuthorize("hasAuthority('admin')")
	public ResponseEntity<ApiResponse<UserModel>> getByUserId(@PathVariable Integer userId) {
		UserModel user = userService.getByUserId(userId);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(user, "User Fetched Successfully", HttpStatus.OK.value()));
	}

	@GetMapping("email/{email}")
	@PreAuthorize("hasAuthority('admin')")
	public ResponseEntity<ApiResponse<UserModel>> getByUserEmail(@PathVariable String email) {
		UserModel user = userService.getByUserEmail(email);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(user, "User Fetched Successfully", HttpStatus.OK.value()));
	}

	@PutMapping("/{userId}")
	@PreAuthorize("hasAuthority('admin')")
	public ResponseEntity<ApiResponse<UserModel>> updateUser(@PathVariable Integer userId,
			@RequestBody UpdateUserRequest request) {
		UserModel user = userService.updateUser(userId, request);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(user, "User Updated Successfully", HttpStatus.OK.value()));
	}

}

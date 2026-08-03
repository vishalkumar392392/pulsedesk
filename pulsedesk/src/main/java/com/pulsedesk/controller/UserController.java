package com.pulsedesk.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.modal.ApiResponse;
import com.pulsedesk.modal.UserModel;
import com.pulsedesk.service.UserService;

@RestController
@RequestMapping("/user")
public class UserController {

	@Autowired
	private UserService userService;

	@GetMapping("id/{userId}")
	public ResponseEntity<ApiResponse<UserModel>> getByUserId(@PathVariable Integer userId) {
		UserModel user = userService.getByUserId(userId);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(user, "User Fetched Successfully", HttpStatus.OK.value()));
	}

	@GetMapping("email/{email}")
	public ResponseEntity<ApiResponse<UserModel>> getByUserEmail(@PathVariable String email) {
		UserModel user = userService.getByUserEmail(email);
		return ResponseEntity.status(HttpStatus.OK)
				.body(ApiResponse.success(user, "User Fetched Successfully", HttpStatus.OK.value()));
	}

}

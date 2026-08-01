package com.pulsedesk.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.model.ApiResponse;
import com.pulsedesk.model.UserModel;
import com.pulsedesk.service.UserService;

@RestController
@RequestMapping("/admin")
public class AdminController {
	
	@Autowired
	private UserService userService;
	
	@GetMapping("/users")
	@PreAuthorize("hasAuthority('admin')")
	public ResponseEntity<ApiResponse<List<UserModel>>> getAllUsers(){
		
		 List<UserModel> users = userService.getAllUsers();
		 return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(users, "Featched users successfully", HttpStatus.OK.value()));
	}

}

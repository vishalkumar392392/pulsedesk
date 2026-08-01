package com.pulsedesk.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsedesk.entites.UserEntity;
import com.pulsedesk.model.ApiResponse;
import com.pulsedesk.model.AuthenticationRequest;
import com.pulsedesk.model.RegisterRequest;
import com.pulsedesk.security.config.JwtUtils;
import com.pulsedesk.service.UserService;

@RestController
@RequestMapping("/auth")
public class UserAuthController {

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private UserDetailsService userDetailsService;

	@Autowired
	private JwtUtils jwtUtils;

	@Autowired
	private UserService service;

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<String>> register(@RequestBody AuthenticationRequest request) {

		authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

		UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
		if (userDetails != null) {
			String token = jwtUtils.generateToken(userDetails);
			return ResponseEntity.status(HttpStatus.OK)
					.body(ApiResponse.success(token, "token generated successfully", HttpStatus.OK.value()));
		} else {
			throw new BadCredentialsException("User not found");
		}

	}

	@PostMapping("/register")
	public ResponseEntity<ApiResponse<UserEntity>> create(@RequestBody RegisterRequest request) {
		UserEntity saved = service.save(request);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success(saved, "User Registered successfully", HttpStatus.CREATED.value()));
	}

}

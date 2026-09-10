package com.pulsedesk.security.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

class JwtUtilsTests {

	private final JwtUtils jwtUtils = new JwtUtils();

	@Test
	void accessTokenExpiresAfterFifteenMinutes() {
		UserDetails user = User.withUsername("session-test@pulsedesk.local")
				.password("unused")
				.authorities("employee")
				.build();
		long issuedAt = System.currentTimeMillis();

		String token = jwtUtils.generateToken(user);
		long expiresAt = jwtUtils.extractExpiration(token).getTime();
		long lifetime = expiresAt - issuedAt;

		assertThat(lifetime).isBetween(Duration.ofMinutes(15).minusSeconds(1).toMillis(),
				Duration.ofMinutes(15).plusSeconds(1).toMillis());
	}

}

package com.pulsedesk.security.config;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Service
public class JwtUtils {

	private static final String TOKEN_TYPE_CLAIM = "tokenType";
	private static final String ACCESS_TOKEN = "access";
	private static final String REFRESH_TOKEN = "refresh";

	// Access token: 10 hours
	private static final long ACCESS_TOKEN_EXPIRY_MS = 1000L * 60 * 60 * 10;

	// Refresh token: 7 days
	private static final long REFRESH_TOKEN_EXPIRY_MS = 1000L * 60 * 60 * 24 * 7;

	private String secret = "jxgEQeXHuPq8VdbyYFNkANdudQ53YUn4jxgEQeXHuPq8VdbyYFNkANdudQ53YUn4";

	public String extractUsername(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	public Date extractExpiration(String token) {
		return extractClaim(token, Claims::getExpiration);
	}

	public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = extractAllClaims(token);
		return claimsResolver.apply(claims);
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
	}

	private Boolean isTokenExpired(String token) {
		return extractExpiration(token).before(new Date());
	}

	public String generateToken(UserDetails userDetails) {
		Map<String, Object> claims = new HashMap<>();
		claims.put(TOKEN_TYPE_CLAIM, ACCESS_TOKEN);
		claims.put("authorities", userDetails.getAuthorities());
		return Jwts.builder()
				.setClaims(claims)
				.setSubject(userDetails.getUsername())
				.setIssuedAt(new Date(System.currentTimeMillis()))
				.setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRY_MS))
				.signWith(SignatureAlgorithm.HS256, secret)
				.compact();
	}

	public String generateRefreshToken(UserDetails userDetails) {
		Map<String, Object> claims = new HashMap<>();
		claims.put(TOKEN_TYPE_CLAIM, REFRESH_TOKEN);
		return Jwts.builder()
				.setClaims(claims)
				.setSubject(userDetails.getUsername())
				.setIssuedAt(new Date(System.currentTimeMillis()))
				.setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRY_MS))
				.signWith(SignatureAlgorithm.HS256, secret)
				.compact();
	}

	public Boolean isRefreshToken(String token) {
		String tokenType = extractClaim(token, claims -> claims.get(TOKEN_TYPE_CLAIM, String.class));
		return REFRESH_TOKEN.equals(tokenType);
	}

	public Boolean validateToken(String token, UserDetails userDetails) {
		final String username = extractUsername(token);
		return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
	}
}

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

		/*
		 * public String generateToken(String username) { Map<String, Object> claims =
		 * new HashMap<>(); return createToken(claims, username); }
		 */
	    
	    public String generateToken(UserDetails userDetails) {
			Map<String, Object> claims = new HashMap<>();
			return createToken(claims, userDetails);
		}

	    private String createToken(Map<String, Object> claims, UserDetails userDetails) {

	        return Jwts.builder().setClaims(claims).setSubject(userDetails.getUsername()).claim("authorities", userDetails.getAuthorities()).setIssuedAt(new Date(System.currentTimeMillis()))
	                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
	                .signWith(SignatureAlgorithm.HS256, secret).compact();
	    }

	    public Boolean validateToken(String token, UserDetails userDetails) {
	        final String username = extractUsername(token);
	        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
	    }
}

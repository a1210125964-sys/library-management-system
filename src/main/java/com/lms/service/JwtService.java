package com.lms.service;

import com.lms.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private final String jwtSecret;
    private final long accessTokenExpireMinutes;
    private final long refreshTokenExpireHours;

    private SecretKey secretKey;

    public JwtService(
        @Value("${app.auth.jwt-secret:library-management-system-jwt-secret-key-please-change}") String jwtSecret,
        @Value("${app.auth.access-token-expire-minutes:120}") long accessTokenExpireMinutes,
        @Value("${app.auth.refresh-token-expire-hours:168}") long refreshTokenExpireHours
    ) {
        this.jwtSecret = jwtSecret;
        this.accessTokenExpireMinutes = accessTokenExpireMinutes;
        this.refreshTokenExpireHours = refreshTokenExpireHours;
    }

    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(normalizeSecret(jwtSecret).getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(String.valueOf(user.getId()))
            .claim("username", user.getUsername())
            .claim("role", user.getRole().name())
            .claim("type", "access")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(Math.max(1, accessTokenExpireMinutes), ChronoUnit.MINUTES)))
            .signWith(secretKey)
            .compact();
    }

    public String createRefreshToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(String.valueOf(user.getId()))
            .claim("type", "refresh")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(Math.max(1, refreshTokenExpireHours), ChronoUnit.HOURS)))
            .signWith(secretKey)
            .compact();
    }

    public Optional<Long> parseAccessTokenUserId(String token) {
        return parseUserIdByType(token, "access");
    }

    public Optional<Long> parseRefreshTokenUserId(String token) {
        return parseUserIdByType(token, "refresh");
    }

    private Optional<Long> parseUserIdByType(String token, String expectedType) {
        try {
            Claims claims = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
            String type = claims.get("type", String.class);
            if (!expectedType.equals(type)) {
                return Optional.empty();
            }
            return Optional.of(Long.parseLong(claims.getSubject()));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private String normalizeSecret(String secret) {
        String fallback = "library-management-system-jwt-secret-key-please-change";
        String value = (secret == null || secret.isBlank()) ? fallback : secret.trim();
        if (value.length() >= 32) {
            return value;
        }
        StringBuilder builder = new StringBuilder(value);
        while (builder.length() < 32) {
            builder.append('0');
        }
        return builder.toString();
    }
}

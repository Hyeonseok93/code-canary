package com.code_canary.backend.security;

import com.code_canary.backend.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private static final int MIN_KEY_BYTES = 32;

    private final JwtProperties jwtProperties;
    private final UserDetailsService userDetailsService;
    private final RevokedTokenService revokedTokenService;
    private Key key;

    @PostConstruct
    protected void init() {
        this.key = Keys.hmacShaKeyFor(resolveSecretBytes(jwtProperties.getSecret()));
    }

    static byte[] resolveSecretBytes(String secret) {
        byte[] decoded = tryBase64Decode(secret);
        if (decoded != null && decoded.length >= MIN_KEY_BYTES) {
            return decoded;
        }

        byte[] utf8 = secret.getBytes(StandardCharsets.UTF_8);
        if (utf8.length >= MIN_KEY_BYTES) {
            return utf8;
        }

        throw new IllegalStateException(
                "JWT_SECRET must be at least 256 bits (32 bytes) as UTF-8 text or Base64."
        );
    }

    private static byte[] tryBase64Decode(String secret) {
        try {
            return Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    public String createToken(String username, String role) {
        Claims claims = Jwts.claims().setSubject(username);
        claims.put("role", role);
        Date now = new Date();
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .setClaims(claims)
                .setId(jti)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + jwtProperties.getExpiration()))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Authentication getAuthentication(String token) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(this.getUsername(token));
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }

    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            if (claims.getExpiration().before(new Date())) {
                return false;
            }

            String jti = claims.getId();
            return !StringUtils.hasText(jti) || !revokedTokenService.isRevoked(jti);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
        }
        return false;
    }

    public void revokeToken(String token) {
        parseRevocationTarget(token).ifPresent(target ->
                revokedTokenService.revoke(target.jti(), target.expiresAt())
        );
    }

    private Optional<RevocationTarget> parseRevocationTarget(String token) {
        try {
            Claims claims = parseClaims(token);
            Date expiresAt = claims.getExpiration();
            if (expiresAt == null || !expiresAt.after(new Date())) {
                return Optional.empty();
            }

            String jti = claims.getId();
            if (!StringUtils.hasText(jti)) {
                return Optional.empty();
            }

            return Optional.of(new RevocationTarget(jti, expiresAt));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    private record RevocationTarget(String jti, Date expiresAt) {
    }
}


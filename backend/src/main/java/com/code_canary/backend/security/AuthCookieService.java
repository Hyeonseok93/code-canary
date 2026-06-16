package com.code_canary.backend.security;

import com.code_canary.backend.config.JwtProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuthCookieService {

    private final JwtProperties jwtProperties;

    public void writeTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = buildCookie(token, Duration.ofMillis(jwtProperties.getExpiration()));
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = buildCookie("", Duration.ZERO);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private ResponseCookie buildCookie(String value, Duration maxAge) {
        String name = Objects.requireNonNull(jwtProperties.getCookie().getName(), "jwt.cookie.name");
        String path = Objects.requireNonNull(jwtProperties.getCookie().getPath(), "jwt.cookie.path");
        String sameSite = Objects.requireNonNull(jwtProperties.getCookie().getSameSite(), "jwt.cookie.same-site");

        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(jwtProperties.getCookie().isSecure())
                .path(path)
                .maxAge(Objects.requireNonNull(maxAge))
                .sameSite(sameSite)
                .build();
    }

    public String readTokenCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        String cookieName = jwtProperties.getCookie().getName();
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }
}

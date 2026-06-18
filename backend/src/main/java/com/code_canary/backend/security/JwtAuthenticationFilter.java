package com.code_canary.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Set<String> SKIP_EXACT_PATHS = Set.of(
            "/api/auth/csrf",
            "/api/auth/login"
    );

    private static final Set<String> SKIP_PREFIXES = Set.of(
            "/api/analytics/",
            "/actuator/"
    );

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieService authCookieService;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        if (SKIP_EXACT_PATHS.contains(path)) {
            return true;
        }
        return SKIP_PREFIXES.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String token = authCookieService.readTokenCookie(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            try {
                Authentication authentication = jwtTokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception ex) {
                log.debug("JWT cookie present but session invalid: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}

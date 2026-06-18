package com.code_canary.backend.controller;

import com.code_canary.backend.constants.RoleConstants;
import com.code_canary.backend.dto.AuthDto;
import com.code_canary.backend.security.AuthCookieService;
import com.code_canary.backend.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AuthCookieService authCookieService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/session")
    public ResponseEntity<AuthDto.SessionResponse> session(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            return ResponseEntity.ok(AuthDto.SessionResponse.anonymous());
        }

        String role = principal.getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse(null);

        if (!RoleConstants.ROLE_ADMIN.equals(role)) {
            return ResponseEntity.ok(AuthDto.SessionResponse.anonymous());
        }

        return ResponseEntity.ok(new AuthDto.SessionResponse(true, principal.getUsername(), role));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String token = authCookieService.readTokenCookie(httpRequest);
        if (token != null) {
            jwtTokenProvider.revokeToken(token);
        }
        authCookieService.clearTokenCookie(httpResponse);
        return ResponseEntity.noContent().build();
    }
}

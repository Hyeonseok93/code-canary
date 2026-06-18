package com.code_canary.backend.controller;

import com.code_canary.backend.dto.AuthDto;
import com.code_canary.backend.security.AuthCookieService;
import com.code_canary.backend.security.ClientIpResolver;
import com.code_canary.backend.security.LoginRateLimiter;
import com.code_canary.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;
    private final LoginRateLimiter loginRateLimiter;
    private final ClientIpResolver clientIpResolver;

    @GetMapping("/csrf")
    public ResponseEntity<AuthDto.CsrfResponse> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok(new AuthDto.CsrfResponse(csrfToken.getHeaderName(), csrfToken.getToken()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.LoginResponse> login(
            @Valid @RequestBody AuthDto.LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String clientIp = clientIpResolver.resolve(httpRequest);
        loginRateLimiter.assertAllowed(clientIp, request.username());

        try {
            AuthDto.LoginResult result = authService.login(request);
            loginRateLimiter.recordSuccess(clientIp, request.username());
            authCookieService.writeTokenCookie(httpResponse, result.accessToken());
            return ResponseEntity.ok(new AuthDto.LoginResponse(result.username(), result.role()));
        } catch (BadCredentialsException ex) {
            loginRateLimiter.recordFailure(clientIp, request.username());
            throw ex;
        }
    }
}

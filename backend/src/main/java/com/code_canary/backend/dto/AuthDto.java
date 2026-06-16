package com.code_canary.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {

    public record LoginRequest(
            @NotBlank @Size(min = 1, max = 64) String username,
            @NotBlank @Size(min = 1, max = 128) String password
    ) {}

    public record LoginResponse(
            String username,
            String role
    ) {}

    public record LoginResult(
            String accessToken,
            String username,
            String role
    ) {}

    public record CsrfResponse(
            String headerName,
            String token
    ) {}

    public record SessionResponse(
            boolean authenticated,
            String username,
            String role
    ) {
        public static SessionResponse anonymous() {
            return new SessionResponse(false, null, null);
        }
    }
}

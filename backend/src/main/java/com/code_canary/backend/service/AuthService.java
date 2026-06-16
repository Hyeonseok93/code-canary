package com.code_canary.backend.service;

import com.code_canary.backend.constants.RoleConstants;
import com.code_canary.backend.dto.AuthDto;
import com.code_canary.backend.entity.User;
import com.code_canary.backend.repository.UserRepository;
import com.code_canary.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthDto.LoginResult login(AuthDto.LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .filter(User::isActive)
                .filter(u -> RoleConstants.ROLE_ADMIN.equals(u.getRole()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new BadCredentialsException("Login failed"));

        String token = jwtTokenProvider.createToken(user.getUsername(), user.getRole());
        return new AuthDto.LoginResult(token, user.getUsername(), user.getRole());
    }
}

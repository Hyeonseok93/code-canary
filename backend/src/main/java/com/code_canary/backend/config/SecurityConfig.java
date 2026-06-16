package com.code_canary.backend.config;

import com.code_canary.backend.constants.RoleConstants;
import com.code_canary.backend.security.AuthCookieService;
import com.code_canary.backend.security.JwtAuthenticationFilter;
import com.code_canary.backend.security.JwtTokenProvider;
import com.code_canary.backend.util.ApiErrorResponseWriter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.util.StringUtils;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final int AUTHENTICATION_FAILED_STATUS = HttpServletResponse.SC_UNAUTHORIZED;
    private static final String AUTHENTICATION_FAILED_ERROR = "Unauthorized";
    private static final String AUTHENTICATION_FAILED_MESSAGE = "Authentication required.";

    private static final int ACCESS_DENIED_STATUS = HttpServletResponse.SC_FORBIDDEN;
    private static final String ACCESS_DENIED_ERROR = "Forbidden";
    private static final String ACCESS_DENIED_MESSAGE = "Access denied.";
    private static final String CSRF_DENIED_MESSAGE = "CSRF validation failed.";

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieService authCookieService;
    private final ObjectMapper objectMapper;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository(JwtProperties jwtProperties) {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieCustomizer(cookie -> {
            cookie.secure(jwtProperties.getCookie().isSecure());
            String sameSite = jwtProperties.getCookie().getSameSite();
            if (StringUtils.hasText(sameSite)) {
                cookie.sameSite(sameSite);
            }
        });
        return repository;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CookieCsrfTokenRepository csrfTokenRepository,
            JwtProperties jwtProperties
    ) throws Exception {
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName("_csrf");

        http
                .cors(AbstractHttpConfigurer::disable)
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(csrfHandler)
                )
                .headers(headers -> {
                    headers.contentTypeOptions(withDefaults());
                    headers.frameOptions(frame -> frame.sameOrigin());
                    headers.referrerPolicy(referrer -> referrer.policy(
                            ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
                    ));
                    headers.permissionsPolicyHeader(permissions -> permissions.policy(
                            "geolocation=(), microphone=(), camera=()"
                    ));
                    if (jwtProperties.getCookie().isSecure()) {
                        headers.httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000));
                    } else {
                        headers.httpStrictTransportSecurity(HeadersConfigurer.HstsConfig::disable);
                    }
                })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/session").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()
                        .requestMatchers("/api/analytics/**").permitAll()
                        .requestMatchers("/api/admin/**").hasAuthority(RoleConstants.ROLE_ADMIN)
                        .anyRequest().denyAll()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) ->
                                ApiErrorResponseWriter.writeForApiOrSendError(
                                        request, response, objectMapper,
                                        AUTHENTICATION_FAILED_STATUS,
                                        AUTHENTICATION_FAILED_ERROR,
                                        AUTHENTICATION_FAILED_MESSAGE))
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            String message = accessDeniedException instanceof CsrfException
                                    ? CSRF_DENIED_MESSAGE
                                    : ACCESS_DENIED_MESSAGE;
                            ApiErrorResponseWriter.writeForApiOrSendError(
                                    request, response, objectMapper,
                                    ACCESS_DENIED_STATUS, ACCESS_DENIED_ERROR, message);
                        })
                )
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtTokenProvider, authCookieService),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}

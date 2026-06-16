package com.code_canary.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Resolves the client IP for rate limiting. Trusts {@code X-Real-IP} only when the
 * immediate remote address matches {@code app.security.trusted-proxy.cidrs}. Ignores
 * client-supplied {@code X-Forwarded-For}. Configure a narrow CIDR (e.g. Docker
 * frontend-net); when unset, {@code X-Real-IP} is never trusted.
 */
@Component
@RequiredArgsConstructor
public class ClientIpResolver {

    private static final String REAL_IP_HEADER = "X-Real-IP";

    private final TrustedProxyMatcher trustedProxyMatcher;

    public String resolve(HttpServletRequest request) {
        if (trustedProxyMatcher.isTrustedProxy(request.getRemoteAddr())) {
            String realIp = request.getHeader(REAL_IP_HEADER);
            if (StringUtils.hasText(realIp)) {
                String trimmed = realIp.trim();
                if (isValidIp(trimmed)) {
                    return trimmed;
                }
            }
        }
        return request.getRemoteAddr();
    }

    private static boolean isValidIp(String ip) {
        try {
            InetAddress.getByName(ip);
            return true;
        } catch (UnknownHostException e) {
            return false;
        }
    }
}

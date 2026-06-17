package com.code_canary.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Resolves the client IP for rate limiting. When the immediate remote address is a
 * configured trusted proxy (Docker frontend-net or VPC/ALB CIDR), uses {@code X-Real-IP}
 * (nginx) or the leftmost {@code X-Forwarded-For} hop (ALB/CloudFront). Otherwise returns
 * {@code remoteAddr} and ignores client-supplied forwarding headers.
 */
@Component
@RequiredArgsConstructor
public class ClientIpResolver {

    private static final String REAL_IP_HEADER = "X-Real-IP";
    private static final String FORWARDED_FOR_HEADER = "X-Forwarded-For";

    private final TrustedProxyMatcher trustedProxyMatcher;

    public String resolve(HttpServletRequest request) {
        if (!trustedProxyMatcher.isTrustedProxy(request.getRemoteAddr())) {
            return request.getRemoteAddr();
        }

        String realIp = request.getHeader(REAL_IP_HEADER);
        if (StringUtils.hasText(realIp)) {
            String trimmed = realIp.trim();
            if (isValidIp(trimmed)) {
                return trimmed;
            }
        }

        String forwardedClient = firstForwardedForClient(request.getHeader(FORWARDED_FOR_HEADER));
        if (forwardedClient != null) {
            return forwardedClient;
        }

        return request.getRemoteAddr();
    }

    private static String firstForwardedForClient(String header) {
        if (!StringUtils.hasText(header)) {
            return null;
        }
        String first = header.split(",")[0].trim();
        return isValidIp(first) ? first : null;
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

package com.code_canary.backend.security;

import com.code_canary.backend.config.TrustedProxyProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClientIpResolverTest {

    @Test
    void ignoresSpoofedRealIpWhenProxyIsNotTrusted() {
        TrustedProxyProperties properties = new TrustedProxyProperties();
        ClientIpResolver resolver = new ClientIpResolver(new TrustedProxyMatcher(properties));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");
        request.addHeader("X-Real-IP", "203.0.113.10");

        assertEquals("192.168.1.50", resolver.resolve(request));
    }

    @Test
    void usesRealIpFromConfiguredTrustedProxy() {
        TrustedProxyProperties properties = new TrustedProxyProperties();
        properties.setCidrs(List.of("172.28.0.0/24"));
        ClientIpResolver resolver = new ClientIpResolver(new TrustedProxyMatcher(properties));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("172.28.0.5");
        request.addHeader("X-Real-IP", "203.0.113.10");

        assertEquals("203.0.113.10", resolver.resolve(request));
    }

    @Test
    void rejectsInvalidRealIpHeader() {
        TrustedProxyProperties properties = new TrustedProxyProperties();
        properties.setCidrs(List.of("172.28.0.0/24"));
        ClientIpResolver resolver = new ClientIpResolver(new TrustedProxyMatcher(properties));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("172.28.0.5");
        request.addHeader("X-Real-IP", "not-an-ip");

        assertEquals("172.28.0.5", resolver.resolve(request));
    }

    @Test
    void usesForwardedForFromConfiguredTrustedProxy() {
        TrustedProxyProperties properties = new TrustedProxyProperties();
        properties.setCidrs(List.of("10.0.0.0/16"));
        ClientIpResolver resolver = new ClientIpResolver(new TrustedProxyMatcher(properties));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.1.50");
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.1.50");

        assertEquals("203.0.113.10", resolver.resolve(request));
    }

    @Test
    void ignoresSpoofedForwardedForWhenProxyIsNotTrusted() {
        TrustedProxyProperties properties = new TrustedProxyProperties();
        ClientIpResolver resolver = new ClientIpResolver(new TrustedProxyMatcher(properties));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");
        request.addHeader("X-Forwarded-For", "203.0.113.10");

        assertEquals("192.168.1.50", resolver.resolve(request));
    }
}

package com.code_canary.backend.security;

public final class RateLimitKeys {

    private static final String PREFIX = "cc:ratelimit";

    private RateLimitKeys() {
    }

    public static String loginFailures(String clientIp) {
        return PREFIX + ":login:fail:" + sanitize(clientIp);
    }

    public static String loginRequests(String clientIp) {
        return PREFIX + ":login:req:" + sanitize(clientIp);
    }

    public static String analytics(String category, String clientIp) {
        return PREFIX + ":analytics:" + category + ":" + sanitize(clientIp);
    }

    private static String sanitize(String clientIp) {
        return clientIp.replace(':', '_').replace('/', '_');
    }
}

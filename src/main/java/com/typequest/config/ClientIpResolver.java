package com.typequest.config;

import jakarta.servlet.http.HttpServletRequest;

// Works out which IP address a request really came from.
//
// Behind a reverse proxy or load balancer (Render, Railway, Nginx, an AWS
// load balancer ...) getRemoteAddr() is the proxy's address, so every player
// would share one rate-limit bucket. The proxy adds the real address to the
// right-hand end of X-Forwarded-For, so we count `trustedProxyHops` entries
// from the right. Entries further left are written by the client and can be
// faked, so they are never used.
//
// trustedProxyHops = 0 (the default) means "no proxy": the header is ignored.
public final class ClientIpResolver {

    private static final int MAX_HEADER_LENGTH = 512;
    private static final int MAX_ADDRESS_LENGTH = 45; // longest IPv6 text form

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request, int trustedProxyHops) {
        String remote = request.getRemoteAddr();

        if (trustedProxyHops <= 0) {
            return remote;
        }

        String header = request.getHeader("X-Forwarded-For");

        if (header == null || header.isBlank() || header.length() > MAX_HEADER_LENGTH) {
            return remote;
        }

        String[] parts = header.split(",");

        if (parts.length < trustedProxyHops) {
            return remote;
        }

        String candidate = parts[parts.length - trustedProxyHops].trim();

        return looksLikeAddress(candidate) ? candidate : remote;
    }

    // Only characters an IPv4 or IPv6 address can contain, so a forged value
    // cannot be used to fill the limiter with arbitrary keys.
    private static boolean looksLikeAddress(String value) {
        if (value.isEmpty() || value.length() > MAX_ADDRESS_LENGTH) {
            return false;
        }

        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            boolean ok = (c >= '0' && c <= '9')
                    || (c >= 'a' && c <= 'f')
                    || (c >= 'A' && c <= 'F')
                    || c == '.' || c == ':';

            if (!ok) {
                return false;
            }
        }

        return true;
    }
}

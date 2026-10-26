package com.typequest.config;

import com.typequest.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    // Registration and password reset allow more attempts than login: a whole
    // classroom can share one school IP address.
    private static final int SIGN_UP_LIMIT = 20;
    private static final int RESET_LIMIT = 10;
    private static final int LINK_LIMIT = 20;
    private static final int CLIENT_ERROR_LIMIT = 30;

    private final RateLimitService rateLimitService;

    // How many reverse proxies sit in front of the app (0 = none). Set with
    // TYPEQUEST_TRUSTED_PROXY_HOPS. See ClientIpResolver.
    @Value("${typequest.rate-limit.trusted-proxy-hops:0}")
    private int trustedProxyHops;

    public RateLimitInterceptor(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException {

        String path = request.getRequestURI();

        // Login and forgot-password use the default limit; the other two
        // endpoints get their own, higher limit.
        int limit = switch (path) {
            case "/api/auth/login", "/api/auth/forgot-password" -> 0;
            case "/api/auth/register" -> SIGN_UP_LIMIT;
            case "/api/auth/reset-password" -> RESET_LIMIT;
            case "/api/auth/verify-email" -> LINK_LIMIT;
            case "/api/client-errors" -> CLIENT_ERROR_LIMIT;
            default -> -1;
        };

        if (limit < 0) {
            return true;
        }

        String clientIp = ClientIpResolver.resolve(request, trustedProxyHops);
        String key = path + ":" + clientIp;

        boolean allowed = limit == 0
                ? rateLimitService.isAllowed(key)
                : rateLimitService.isAllowed(key, limit);

        if (!allowed) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"message\":\"Too many requests. Please try again later.\","
                            + "\"error\":\"Too many requests. Please try again later.\"}"
            );
            return false;
        }

        return true;
    }
}
package com.typequest.config;

import com.typequest.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    private final RateLimitService rateLimitService;

    public RateLimitInterceptor(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException {

        String path = request.getRequestURI();

        boolean isSensitiveEndpoint =
                path.equals("/api/auth/login")
                        || path.equals("/api/auth/forgot-password");

        if (!isSensitiveEndpoint) {
            return true;
        }

        String clientIp = request.getRemoteAddr();
        String key = path + ":" + clientIp;

        if (!rateLimitService.isAllowed(key)) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Too many requests. Please try again later.\"}"
            );
            return false;
        }

        return true;
    }
}
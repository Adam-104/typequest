package com.typequest.config;

import com.typequest.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitInterceptorTest {

    private RateLimitService rateLimitService;
    private RateLimitInterceptor interceptor;
    private HttpServletRequest request;
    private HttpServletResponse response;

    @BeforeEach
    void setUp() {
        rateLimitService = mock(RateLimitService.class);
        interceptor = new RateLimitInterceptor(rateLimitService);

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
    }

    @Test
    void loginRequestIsAllowedWhenWithinLimit() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(rateLimitService.isAllowed(
                "/api/auth/login:127.0.0.1"
        )).thenReturn(true);

        boolean result = interceptor.preHandle(request, response, new Object());

        assertTrue(result);

        verify(rateLimitService).isAllowed("/api/auth/login:127.0.0.1");
        verify(response, never()).setStatus(429);
    }

    @Test
    void forgotPasswordRequestIsRateLimited() throws Exception {
        when(request.getRequestURI())
                .thenReturn("/api/auth/forgot-password");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(rateLimitService.isAllowed(
                "/api/auth/forgot-password:127.0.0.1"
        )).thenReturn(false);

        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));

        boolean result = interceptor.preHandle(request, response, new Object());

        assertFalse(result);
        verify(response).setStatus(429);
        verify(response).setContentType("application/json");

        assertEquals(
                "{\"error\":\"Too many requests. Please try again later.\"}",
                body.toString()
        );
    }

    @Test
    void loginRequestIsRejectedWhenRateLimitExceeded() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("192.168.1.10");
        when(rateLimitService.isAllowed(
                "/api/auth/login:192.168.1.10"
        )).thenReturn(false);

        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));

        boolean result = interceptor.preHandle(request, response, new Object());

        assertFalse(result);
        verify(response).setStatus(429);
        verify(response).setContentType("application/json");

        assertEquals(
                "{\"error\":\"Too many requests. Please try again later.\"}",
                body.toString()
        );
    }

    @Test
    void nonSensitiveEndpointIsNotRateLimited() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/users/profile");

        boolean result = interceptor.preHandle(request, response, new Object());

        assertTrue(result);

        verifyNoInteractions(rateLimitService);
        verify(response, never()).setStatus(429);
    }
}
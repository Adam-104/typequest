package com.typequest.integration;

import com.typequest.service.AuthService;
import com.typequest.service.RateLimitService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;


import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "typequest.admin.initializer.enabled=false",
        "MAIL_HOST=localhost",
        "MAIL_PORT=587",
        "MAIL_USERNAME=test",
        "MAIL_PASSWORD=test",
        "MAIL_FROM=test@example.com",
        "typequest.jwt.secret=VGhpc0lzQVRlc3RTZWNyZXRLZXlUaGF0SXNMb25nRW5vdWdoIQ==",
        "spring.datasource.url=jdbc:mysql://localhost:3306/typequest_db",
        "spring.datasource.username=root",
        "spring.datasource.password=root"
})
@AutoConfigureMockMvc
class RateLimitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RateLimitService rateLimitService;

    @MockitoBean
    private AuthService authService;

    @Test
    void loginRequestPassesWhenRateLimitAllowsIt() throws Exception {
        when(rateLimitService.isAllowed(anyString())).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@example.com",
                                  "password": "ExamplePassword123!"
                                }
                                """))
                .andExpect(status().isOk());

        verify(rateLimitService).isAllowed(anyString());
    }

    @Test
    void loginRequestIsRejectedWhenRateLimitIsExceeded() throws Exception {
        when(rateLimitService.isAllowed(anyString())).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@example.com",
                                  "password": "ExamplePassword123!"
                                }
                                """))
                .andExpect(status().isTooManyRequests());

        verify(rateLimitService).isAllowed(anyString());
        verifyNoInteractions(authService);
    }

    @Test
    void forgotPasswordRequestIsRejectedWhenRateLimitIsExceeded()
            throws Exception {
        when(rateLimitService.isAllowed(anyString())).thenReturn(false);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@example.com"
                                }
                                """))
                .andExpect(status().isTooManyRequests());

        verify(rateLimitService).isAllowed(anyString());
    }

    @Test
    void nonSensitiveEndpointDoesNotInvokeRateLimiter() throws Exception {
        // /api/auth/refresh is called silently in the background by the app,
        // so it must never be rate limited.
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\": \"anything\"}"));

        verify(rateLimitService, never()).isAllowed(anyString());
        verify(rateLimitService, never()).isAllowed(anyString(), anyInt());
    }
}

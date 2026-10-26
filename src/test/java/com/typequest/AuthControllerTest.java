package com.typequest;

import com.typequest.dto.AuthResponse;
import com.typequest.exception.EmailAlreadyExistsException;
import com.typequest.exception.InvalidCredentialsException;
import com.typequest.service.AuthService;
import com.typequest.service.JwtService;
import com.typequest.service.RateLimitService;
import com.typequest.service.RefreshTokenService;
import com.typequest.dto.LoginRequest;
import com.typequest.dto.RefreshTokenResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        // Disable admin account initialization during this test
        "typequest.admin.initializer.enabled=false",

        // Test-only SMTP configuration
        "MAIL_HOST=localhost",
        "MAIL_PORT=587",
        "MAIL_USERNAME=test",
        "MAIL_PASSWORD=test",
        "MAIL_FROM=test@example.com",

        // Test JWT secret (Base64-encoded)
        "typequest.jwt.secret=VGhpc0lzQVRlc3RTZWNyZXRLZXlUaGF0SXNMb25nRW5vdWdoIQ==",

        // Test database configuration
        "spring.datasource.url=jdbc:mysql://localhost:3306/typequest_db",
        "spring.datasource.username=root",
        "spring.datasource.password=root"
})
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RateLimitService rateLimitService;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;


    // Register and reset-password use the limiter with a custom limit. The
    // mocked limiter would answer "no" by default, so allow those requests.
    @BeforeEach
    void allowCustomLimits() {
        when(rateLimitService.isAllowed(anyString(), anyInt())).thenReturn(true);
    }

    // Test 1: Logout without an access token should return 401
    @Test
    void logoutWithoutAccessTokenReturnsUnauthorized() throws Exception {

        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "refreshToken": "some-refresh-token"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }


    // Test 2: Reject logout when the refresh token belongs to another user
    @Test
    void logoutWithAnotherUsersRefreshTokenReturnsForbidden() throws Exception {

        doThrow(new AccessDeniedException(
                "You cannot revoke another user's refresh token."
        )).when(refreshTokenService)
                .revokeRefreshTokenForUser(
                        "another-users-refresh-token",
                        1L
                );

        mockMvc.perform(post("/api/auth/logout")
                        .with(SecurityMockMvcRequestPostProcessors.user("1")
                                .authorities(
                                        new SimpleGrantedAuthority("ROLE_USER")
                                ))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "refreshToken": "another-users-refresh-token"
                                }
                                """))
                .andExpect(status().isForbidden());

        verify(refreshTokenService).revokeRefreshTokenForUser(
                "another-users-refresh-token",
                1L
        );
    }


    @Test
    void logoutWithOwnRefreshTokenReturnsOk() throws Exception {

        mockMvc.perform(post("/api/auth/logout")
                        .with(SecurityMockMvcRequestPostProcessors.user("1")
                                .authorities(
                                        new SimpleGrantedAuthority("ROLE_USER")
                                ))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "refreshToken": "my-refresh-token"
                            }
                            """))
                .andExpect(status().isOk());

        verify(refreshTokenService).revokeRefreshTokenForUser(
                "my-refresh-token",
                1L
        );
    }

    @Test
    void refreshWithValidRefreshTokenReturnsOk() throws Exception {

        RefreshTokenResponse response = new RefreshTokenResponse(
                "new-access-token",
                "new-refresh-token",
                1L,
                "testuser",
                "test@example.com"
        );

        org.mockito.Mockito.when(
                refreshTokenService.refreshTokens("valid-refresh-token")
        ).thenReturn(response);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "refreshToken": "valid-refresh-token"
                            }
                            """))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.accessToken").value("new-access-token"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.refreshToken").value("new-refresh-token"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.userId").value(1))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.username").value("testuser"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.email").value("test@example.com"));

        org.mockito.Mockito.verify(refreshTokenService)
                .refreshTokens("valid-refresh-token");
    }


    @Test
    void refreshWithInvalidRefreshTokenReturnsBadRequest() throws Exception {

        org.mockito.Mockito.when(
                refreshTokenService.refreshTokens("invalid-refresh-token")
        ).thenThrow(new IllegalArgumentException("Invalid refresh token."));

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "refreshToken": "invalid-refresh-token"
                            }
                            """))
                .andExpect(status().isBadRequest());

        org.mockito.Mockito.verify(refreshTokenService)
                .refreshTokens("invalid-refresh-token");
    }


    @Test
    void refreshWithReusedRefreshTokenReturnsBadRequest() throws Exception {

        org.mockito.Mockito.when(
                refreshTokenService.refreshTokens("previously-used-token")
        ).thenThrow(
                new IllegalArgumentException(
                        "Refresh token has already been revoked."
                )
        );

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "refreshToken": "previously-used-token"
                            }
                            """))
                .andExpect(status().isBadRequest());

        org.mockito.Mockito.verify(refreshTokenService)
                .refreshTokens("previously-used-token");
    }


    @Test
    void registerWithValidRequestReturnsCreated() throws Exception {

        org.mockito.Mockito.when(
                authService.register(
                        org.mockito.ArgumentMatchers.any(
                                com.typequest.dto.RegisterRequest.class
                        )
                )
        ).thenReturn("User registered successfully.");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "username": "testuser",
                                "email": "test@example.com",
                                "password": "StrongPassword123!"
                            }
                            """))
                .andExpect(status().isCreated())
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.message")
                                .value("User registered successfully.")
                );

        org.mockito.Mockito.verify(authService)
                .register(
                        org.mockito.ArgumentMatchers.any(
                                com.typequest.dto.RegisterRequest.class
                        )
                );
    }


    @Test
    void registerWithExistingEmailReturnsConflict() throws Exception {

        org.mockito.Mockito.when(
                authService.register(
                        org.mockito.ArgumentMatchers.any(
                                com.typequest.dto.RegisterRequest.class
                        )
                )
        ).thenThrow(
                new EmailAlreadyExistsException(
                        "Email is already registered."
                )
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "username": "testuser",
                                "email": "existing@example.com",
                                "password": "StrongPassword123!"
                            }
                            """))
                .andExpect(status().isConflict())
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.message")
                                .value("Email is already registered.")
                );

        org.mockito.Mockito.verify(authService)
                .register(
                        org.mockito.ArgumentMatchers.any(
                                com.typequest.dto.RegisterRequest.class
                        )
                );
    }


    @Test
    void registerWithInvalidEmailReturnsBadRequest() throws Exception {

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "username": "testuser",
                                "email": "invalid-email",
                                "password": "StrongPassword123!"
                            }
                            """))
                .andExpect(status().isBadRequest());

        org.mockito.Mockito.verifyNoInteractions(authService);
    }


    @Test
    void registerWithShortPasswordReturnsBadRequest() throws Exception {

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "username": "testuser",
                                "email": "test@example.com",
                                "password": "Ab12"
                            }
                            """))
                .andExpect(status().isBadRequest());

        org.mockito.Mockito.verifyNoInteractions(authService);
    }


    @Test
    void loginWithValidCredentialsReturnsOk() throws Exception {

        // Allow the login request through the rate limiter.
        org.mockito.Mockito.when(
                rateLimitService.isAllowed(
                        org.mockito.ArgumentMatchers.anyString()
                )
        ).thenReturn(true);

        AuthResponse response = new AuthResponse(
                "Login successful",
                "test-access-token",
                1L,
                "testuser",
                "test@example.com"
        );

        response.setRefreshToken("test-refresh-token");

        org.mockito.Mockito.when(
                authService.login(
                        org.mockito.ArgumentMatchers.any(
                                LoginRequest.class
                        )
                )
        ).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "email": "test@example.com",
                                "password": "StrongPassword123!"
                            }
                            """))
                .andExpect(status().isOk())
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.token")
                                .value("test-access-token")
                )
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.refreshToken")
                                .value("test-refresh-token")
                )
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.userId")
                                .value(1)
                )
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.username")
                                .value("testuser")
                )
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.email")
                                .value("test@example.com")
                );

        org.mockito.Mockito.verify(authService)
                .login(org.mockito.ArgumentMatchers.any(LoginRequest.class));
    }


    @Test
    void loginWithInvalidCredentialsReturnsUnauthorized() throws Exception {

        // Allow the request through the rate limiter.
        org.mockito.Mockito.when(
                rateLimitService.isAllowed(
                        org.mockito.ArgumentMatchers.anyString()
                )
        ).thenReturn(true);

        // Simulate invalid login credentials.
        org.mockito.Mockito.when(
                authService.login(
                        org.mockito.ArgumentMatchers.any(LoginRequest.class)
                )
        ).thenThrow(
                new InvalidCredentialsException("Invalid email or password.")
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "email": "test@example.com",
                                "password": "WrongPassword123!"
                            }
                            """))
                .andExpect(status().isUnauthorized())
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.message")
                                .value("Invalid email or password.")
                );

        org.mockito.Mockito.verify(authService)
                .login(org.mockito.ArgumentMatchers.any(LoginRequest.class));
    }


    @Test
    void loginWithInvalidEmailReturnsBadRequest() throws Exception {

        // Allow the request through the rate limiter.
        org.mockito.Mockito.when(
                rateLimitService.isAllowed(
                        org.mockito.ArgumentMatchers.anyString()
                )
        ).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "email": "invalid-email",
                                "password": "StrongPassword123!"
                            }
                            """))
                .andExpect(status().isBadRequest());

        // Validation should reject the request before authentication.
        org.mockito.Mockito.verifyNoInteractions(authService);
    }


    @Test
    void loginWithoutPasswordReturnsBadRequest() throws Exception {

        // Allow the request through the rate limiter.
        org.mockito.Mockito.when(
                rateLimitService.isAllowed(
                        org.mockito.ArgumentMatchers.anyString()
                )
        ).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "email": "test@example.com",
                                "password": ""
                            }
                            """))
                .andExpect(status().isBadRequest());

        // Validation should reject the request before authentication.
        org.mockito.Mockito.verifyNoInteractions(authService);
    }


    @Test
    void loginWithLockedAccountReturnsUnauthorized() throws Exception {

        // Allow the request through the rate limiter.
        org.mockito.Mockito.when(
                rateLimitService.isAllowed(
                        org.mockito.ArgumentMatchers.anyString()
                )
        ).thenReturn(true);

        // Simulate the service rejecting a locked account.
        org.mockito.Mockito.when(
                authService.login(
                        org.mockito.ArgumentMatchers.any(LoginRequest.class)
                )
        ).thenThrow(
                new InvalidCredentialsException(
                        "Invalid email or password."
                )
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "email": "test@example.com",
                                "password": "StrongPassword123!"
                            }
                            """))
                .andExpect(status().isUnauthorized())
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers
                                .jsonPath("$.message")
                                .value("Invalid email or password.")
                );

        org.mockito.Mockito.verify(authService)
                .login(org.mockito.ArgumentMatchers.any(LoginRequest.class));
    }
}
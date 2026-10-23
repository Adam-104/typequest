package com.typequest;

import com.typequest.dto.AuthResponse;
import com.typequest.dto.LoginRequest;
import com.typequest.exception.InvalidCredentialsException;
import com.typequest.model.Role;
import com.typequest.model.User;
import com.typequest.repository.UserRepository;
import com.typequest.service.AuthService;
import com.typequest.service.JwtService;
import com.typequest.service.RefreshTokenService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private RefreshTokenService refreshTokenService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        refreshTokenService = mock(RefreshTokenService.class);

        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                refreshTokenService
        );
    }

    @Test
    void loginWithValidCredentialsReturnsBothTokens() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encoded-password");
        user.setRole(Role.ROLE_USER);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("CorrectPassword123!");

        when(userRepository.findByEmailForUpdate("test@example.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(
                "CorrectPassword123!",
                "encoded-password"
        )).thenReturn(true);

        when(jwtService.generateToken(
                1L,
                "test@example.com",
                Role.ROLE_USER
        )).thenReturn("mock-access-token");

        when(refreshTokenService.createRefreshToken(user))
                .thenReturn("mock-refresh-token");

        // Act
        AuthResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("mock-access-token", response.getToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());

        verify(userRepository).findByEmailForUpdate("test@example.com");

        verify(passwordEncoder).matches(
                "CorrectPassword123!",
                "encoded-password"
        );

        verify(jwtService).generateToken(
                1L,
                "test@example.com",
                Role.ROLE_USER
        );

        verify(refreshTokenService).createRefreshToken(user);
    }

    @Test
    void loginWithIncorrectPasswordThrowsException() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encoded-password");
        user.setRole(Role.ROLE_USER);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("WrongPassword123!");

        when(userRepository.findByEmailForUpdate("test@example.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(
                "WrongPassword123!",
                "encoded-password"
        )).thenReturn(false);

        // Act and Assert
        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(request)
        );

        verify(jwtService, never()).generateToken(
                anyLong(),
                anyString(),
                any(Role.class)
        );

        verify(refreshTokenService, never()).createRefreshToken(any(User.class));
    }

    @Test
    void fifthFailedLoginAttemptLocksAccountFor15Minutes() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encoded-password");
        user.setRole(Role.ROLE_USER);
        user.setFailedLoginAttempts(4);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("WrongPassword123!");

        when(userRepository.findByEmailForUpdate("test@example.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(
                "WrongPassword123!",
                "encoded-password"
        )).thenReturn(false);

        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(request)
        );

        assertEquals(0, user.getFailedLoginAttempts());
        assertNotNull(user.getLockedUntil());
        assertTrue(
                user.getLockedUntil().isAfter(LocalDateTime.now())
        );

        verify(userRepository).save(user);
        verify(jwtService, never()).generateToken(
                anyLong(),
                anyString(),
                any(Role.class)
        );

        verify(refreshTokenService, never())
                .createRefreshToken(any(User.class));
    }


    @Test
    void loginWhileAccountIsLockedIsRejected() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encoded-password");
        user.setRole(Role.ROLE_USER);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(10));

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("CorrectPassword123!");

        when(userRepository.findByEmailForUpdate("test@example.com"))
                .thenReturn(Optional.of(user));

        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(request)
        );

        verify(passwordEncoder, never()).matches(
                anyString(),
                anyString()
        );

        verify(jwtService, never()).generateToken(
                anyLong(),
                anyString(),
                any(Role.class)
        );

        verify(refreshTokenService, never())
                .createRefreshToken(any(User.class));
    }


    @Test
    void failedLoginAttemptIsPersisted() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encoded-password");
        user.setRole(Role.ROLE_USER);
        user.setFailedLoginAttempts(0);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("WrongPassword123!");

        when(userRepository.findByEmailForUpdate("test@example.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(
                "WrongPassword123!",
                "encoded-password"
        )).thenReturn(false);

        // Act and Assert
        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(request)
        );

        // Verify the counter was incremented and saved.
        assertEquals(1, user.getFailedLoginAttempts());
        verify(userRepository).save(user);

        verify(jwtService, never()).generateToken(
                anyLong(),
                anyString(),
                any(Role.class)
        );

        verify(refreshTokenService, never())
                .createRefreshToken(any(User.class));
    }


    @Test
    void successfulLoginResetsFailedAttemptsAndClearsLock() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encoded-password");
        user.setRole(Role.ROLE_USER);
        user.setFailedLoginAttempts(3);
        user.setLockedUntil(null);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("CorrectPassword123!");

        when(userRepository.findByEmailForUpdate("test@example.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(
                "CorrectPassword123!",
                "encoded-password"
        )).thenReturn(true);

        when(jwtService.generateToken(
                1L,
                "test@example.com",
                Role.ROLE_USER
        )).thenReturn("mock-access-token");

        when(refreshTokenService.createRefreshToken(user))
                .thenReturn("mock-refresh-token");

        // Act
        AuthResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals(0, user.getFailedLoginAttempts());
        assertNull(user.getLockedUntil());

        verify(userRepository).save(user);
        verify(jwtService).generateToken(
                1L,
                "test@example.com",
                Role.ROLE_USER
        );
        verify(refreshTokenService).createRefreshToken(user);
    }
}

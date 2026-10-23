package com.typequest;

import com.typequest.model.RefreshToken;
import com.typequest.model.Role;
import com.typequest.model.User;
import com.typequest.repository.RefreshTokenRepository;
import com.typequest.service.RefreshTokenService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtEncoder;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RefreshTokenServiceTest {

    private RefreshTokenRepository refreshTokenRepository;
    private JwtEncoder jwtEncoder;
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        jwtEncoder = mock(JwtEncoder.class);

        refreshTokenService = new RefreshTokenService(
                refreshTokenRepository,
                jwtEncoder
        );
    }

    @Test
    void rotateRefreshTokenRevokesOldTokenAndCreatesReplacement() {
        // Arrange
        User user = createTestUser();

        RefreshToken oldToken = new RefreshToken();
        oldToken.setUser(user);
        oldToken.setTokenHash(createHashForTesting());
        oldToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        oldToken.setRevoked(false);

        // The repository returns the existing token for the lookup.
        when(refreshTokenRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(oldToken));

        // Act
        String newRawToken =
                refreshTokenService.rotateRefreshToken("old-raw-token");

        // Assert
        assertNotNull(newRawToken);
        assertFalse(newRawToken.isBlank());
        assertNotEquals("old-raw-token", newRawToken);

        assertTrue(oldToken.isRevoked());

        // The old token is revoked and the replacement is saved.
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void rotateRefreshTokenRejectsRevokedToken() {
        // Arrange
        RefreshToken revokedToken = new RefreshToken();
        revokedToken.setRevoked(true);
        revokedToken.setExpiresAt(LocalDateTime.now().plusDays(7));

        when(refreshTokenRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(revokedToken));

        // Act and Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> refreshTokenService.rotateRefreshToken("revoked-token")
        );

        assertEquals(
                "Refresh token has already been revoked.",
                exception.getMessage()
        );

        verify(refreshTokenRepository, never())
                .save(any(RefreshToken.class));
    }

    @Test
    void rotateRefreshTokenRejectsExpiredToken() {
        // Arrange
        RefreshToken expiredToken = new RefreshToken();
        expiredToken.setRevoked(false);
        expiredToken.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(refreshTokenRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(expiredToken));

        // Act and Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> refreshTokenService.rotateRefreshToken("expired-token")
        );

        assertEquals(
                "Refresh token has expired.",
                exception.getMessage()
        );

        verify(refreshTokenRepository, never())
                .save(any(RefreshToken.class));
    }

    private User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setRole(Role.ROLE_USER);
        return user;
    }

    private String createHashForTesting() {
        byte[] bytes = new byte[32];
        return Base64.getEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }


    @Test
    void userCanRevokeTheirOwnRefreshToken() {
        // Arrange
        User user = createTestUser();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setRevoked(false);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));

        when(refreshTokenRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(refreshToken));

        // Act
        refreshTokenService.revokeRefreshTokenForUser(
                "valid-refresh-token",
                user.getId()
        );

        // Assert
        assertTrue(refreshToken.isRevoked());

        verify(refreshTokenRepository).save(refreshToken);
    }

    @Test
    void userCannotRevokeAnotherUsersRefreshToken() {
        // Arrange
        User userB = createTestUser();
        userB.setId(2L);
        userB.setEmail("userb@example.com");

        RefreshToken userBToken = new RefreshToken();
        userBToken.setUser(userB);
        userBToken.setRevoked(false);
        userBToken.setExpiresAt(LocalDateTime.now().plusDays(7));

        when(refreshTokenRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(userBToken));

        // Act and Assert
        org.springframework.security.access.AccessDeniedException exception =
                assertThrows(
                        org.springframework.security.access.AccessDeniedException.class,
                        () -> refreshTokenService.revokeRefreshTokenForUser(
                                "user-b-refresh-token",
                                1L
                        )
                );

        assertEquals(
                "You cannot revoke another user's refresh token.",
                exception.getMessage()
        );

        assertFalse(userBToken.isRevoked());

        verify(refreshTokenRepository, never())
                .save(any(RefreshToken.class));
    }

    @Test
    void repeatedLogoutDoesNotChangeAlreadyRevokedToken() {
        // Arrange
        User user = createTestUser();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setRevoked(true);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));

        when(refreshTokenRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(refreshToken));

        // Act
        refreshTokenService.revokeRefreshTokenForUser(
                "already-revoked-token",
                user.getId()
        );

        // Assert
        assertTrue(refreshToken.isRevoked());

        // No additional database save is needed.
        verify(refreshTokenRepository, never())
                .save(any(RefreshToken.class));
    }
}
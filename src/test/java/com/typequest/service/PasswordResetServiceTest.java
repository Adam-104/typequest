package com.typequest.service;

import com.typequest.model.PasswordResetToken;
import com.typequest.model.User;
import com.typequest.repository.PasswordResetTokenRepository;
import com.typequest.repository.RefreshTokenRepository;
import com.typequest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PasswordResetServiceTest {

    private static final String RAW_TOKEN = "raw-token-value";

    private PasswordResetTokenRepository tokenRepository;
    private UserRepository userRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private PasswordEncoder passwordEncoder;
    private PasswordResetService service;

    private User user;
    private PasswordResetToken token;

    @BeforeEach
    void setUp() throws Exception {
        tokenRepository = mock(PasswordResetTokenRepository.class);
        userRepository = mock(UserRepository.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);

        when(passwordEncoder.encode(any())).thenReturn("new-hash");

        service = new PasswordResetService(
                tokenRepository,
                userRepository,
                refreshTokenRepository,
                passwordEncoder,
                mock(EmailService.class),
                "http://localhost:5173/reset-password"
        );

        user = new User();
        user.setId(7L);
        user.setFailedLoginAttempts(3);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(10));

        token = new PasswordResetToken();
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        token.setUsed(false);

        String hash = HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256")
                        .digest(RAW_TOKEN.getBytes(StandardCharsets.UTF_8)));

        when(tokenRepository.findByTokenHashForUpdate(hash)).thenReturn(Optional.of(token));
        when(tokenRepository.findAllByUser_IdAndUsedFalse(7L)).thenReturn(List.of());
    }

    @Test
    void resettingThePasswordSignsTheUserOutEverywhere() {
        service.resetPassword(RAW_TOKEN, "a-brand-new-password");

        verify(refreshTokenRepository).revokeAllForUser(7L);
        assertEquals("new-hash", user.getPassword());
        assertTrue(token.isUsed());
    }

    @Test
    void resettingThePasswordClearsAnAccountLockout() {
        service.resetPassword(RAW_TOKEN, "a-brand-new-password");

        assertEquals(0, user.getFailedLoginAttempts());
        assertNull(user.getLockedUntil());
    }

    @Test
    void weakPasswordChangesNothing() {
        assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword(RAW_TOKEN, "too-short"));

        verify(refreshTokenRepository, never()).revokeAllForUser(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void expiredLinkChangesNothing() {
        token.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword(RAW_TOKEN, "a-brand-new-password"));

        verify(refreshTokenRepository, never()).revokeAllForUser(any());
    }
}

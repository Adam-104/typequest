package com.typequest.service;

import com.typequest.model.PasswordResetToken;
import com.typequest.model.Role;
import com.typequest.model.User;
import com.typequest.repository.EmailTokenRepository;
import com.typequest.repository.GameRepository;
import com.typequest.repository.LessonProgressRepository;
import com.typequest.repository.PasswordResetTokenRepository;
import com.typequest.repository.RefreshTokenRepository;
import com.typequest.repository.UserAchievementRepository;
import com.typequest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private RefreshTokenService refreshTokenService;
    private RefreshTokenRepository refreshTokenRepository;
    private PasswordResetTokenRepository resetTokenRepository;
    private EmailTokenRepository emailTokenRepository;
    private GameRepository gameRepository;
    private LessonProgressRepository lessonProgressRepository;
    private UserAchievementRepository userAchievementRepository;
    private AccountService service;
    private User user;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        refreshTokenService = mock(RefreshTokenService.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        resetTokenRepository = mock(PasswordResetTokenRepository.class);
        emailTokenRepository = mock(EmailTokenRepository.class);
        gameRepository = mock(GameRepository.class);
        lessonProgressRepository = mock(LessonProgressRepository.class);
        userAchievementRepository = mock(UserAchievementRepository.class);

        service = new AccountService(
                userRepository, passwordEncoder, refreshTokenService,
                refreshTokenRepository, resetTokenRepository, emailTokenRepository,
                gameRepository, lessonProgressRepository, userAchievementRepository);

        user = new User();
        user.setId(3L);
        user.setPassword("old-hash");
        user.setRole(Role.ROLE_USER);

        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current-password-1", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode(any())).thenReturn("new-hash");
        when(resetTokenRepository.findAllByUser_IdAndUsedFalse(3L)).thenReturn(List.of());
    }

    @Test
    void changePasswordKeepsThisSessionAndSignsOutTheRest() {
        service.changePassword(3L, "current-password-1", "a-brand-new-password", "my-refresh-token");

        assertEquals("new-hash", user.getPassword());
        verify(refreshTokenService).revokeAllExcept(3L, "my-refresh-token");
    }

    @Test
    void changePasswordRetiresPendingResetLinks() {
        PasswordResetToken pending = new PasswordResetToken();
        when(resetTokenRepository.findAllByUser_IdAndUsedFalse(3L)).thenReturn(List.of(pending));

        service.changePassword(3L, "current-password-1", "a-brand-new-password", null);

        assertTrue(pending.isUsed());
    }

    @Test
    void wrongCurrentPasswordChangesNothing() {
        assertThrows(IllegalArgumentException.class,
                () -> service.changePassword(3L, "nope", "a-brand-new-password", null));

        verify(userRepository, never()).save(any());
        verify(refreshTokenService, never()).revokeAllExcept(any(), any());
    }

    @Test
    void weakOrUnchangedNewPasswordIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> service.changePassword(3L, "current-password-1", "short", null));
        assertThrows(IllegalArgumentException.class,
                () -> service.changePassword(3L, "current-password-1", "current-password-1", null));

        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteAccountRemovesEverythingTheUserOwns() {
        service.deleteAccount(3L, "current-password-1");

        verify(refreshTokenRepository).deleteAllByUser(user);
        verify(resetTokenRepository).deleteAllByUser_Id(3L);
        verify(emailTokenRepository).deleteAllByUser_Id(3L);
        verify(lessonProgressRepository).deleteAllByUser_Id(3L);
        verify(userAchievementRepository).deleteAllByUser_Id(3L);
        verify(gameRepository).deleteAllByUser_Id(3L);
        verify(userRepository).delete(user);
    }

    @Test
    void deleteAccountNeedsTheRightPassword() {
        assertThrows(IllegalArgumentException.class, () -> service.deleteAccount(3L, "wrong"));

        verify(userRepository, never()).delete(any());
    }

    @Test
    void adminsCannotDeleteThemselves() {
        user.setRole(Role.ROLE_ADMIN);

        assertThrows(IllegalArgumentException.class,
                () -> service.deleteAccount(3L, "current-password-1"));

        verify(userRepository, never()).delete(any());
    }
}

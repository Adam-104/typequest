package com.typequest.service;

import com.typequest.dto.AdminDtos.UserUpdate;
import com.typequest.model.Role;
import com.typequest.model.User;
import com.typequest.repository.AchievementRepository;
import com.typequest.repository.GameRepository;
import com.typequest.repository.LessonProgressRepository;
import com.typequest.repository.PassageRepository;
import com.typequest.repository.RefreshTokenRepository;
import com.typequest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminServiceTest {

    private UserRepository userRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private AdminService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);

        service = new AdminService(
                userRepository,
                mock(GameRepository.class),
                mock(LessonProgressRepository.class),
                mock(AchievementRepository.class),
                mock(PassageRepository.class),
                refreshTokenRepository
        );
    }

    private User user(long id, Role role) {
        User user = new User();

        user.setId(id);
        user.setUsername("user" + id);
        user.setEmail("u" + id + "@example.com");
        user.setRole(role);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        return user;
    }

    @Test
    void disablingAnAccountRevokesItsRefreshTokens() {
        User target = user(2L, Role.ROLE_USER);

        var row = service.updateUser(1L, 2L, new UserUpdate(true, null, null));

        assertTrue(row.disabled());
        assertTrue(target.isDisabled());
        verify(refreshTokenRepository).revokeAllForUser(2L);
    }

    @Test
    void adminCannotDisableOwnAccount() {
        user(1L, Role.ROLE_ADMIN);

        assertThrows(ResponseStatusException.class,
                () -> service.updateUser(1L, 1L, new UserUpdate(true, null, null)));
    }

    @Test
    void adminCannotDemoteThemselves() {
        user(1L, Role.ROLE_ADMIN);

        assertThrows(ResponseStatusException.class,
                () -> service.updateUser(1L, 1L, new UserUpdate(null, null, "ROLE_USER")));
    }

    @Test
    void roleAndLeaderboardBanAreApplied() {
        User target = user(3L, Role.ROLE_USER);

        service.updateUser(1L, 3L, new UserUpdate(null, true, "ROLE_ADMIN"));

        assertTrue(target.isLeaderboardBanned());
        assertEquals(Role.ROLE_ADMIN, target.getRole());
        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void unlockClearsTheLock() {
        User target = user(4L, Role.ROLE_USER);

        target.setLockedUntil(java.time.LocalDateTime.now().plusMinutes(10));
        target.setFailedLoginAttempts(3);

        var row = service.unlockUser(4L);

        assertFalse(row.locked());
        assertEquals(0, target.getFailedLoginAttempts());
    }

    @Test
    void unknownUserIsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> service.unlockUser(99L));
    }
}

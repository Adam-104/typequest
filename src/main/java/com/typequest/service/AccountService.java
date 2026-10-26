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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Things a signed-in player does to their own account.
@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailTokenRepository emailTokenRepository;
    private final GameRepository gameRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserAchievementRepository userAchievementRepository;

    public AccountService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailTokenRepository emailTokenRepository,
            GameRepository gameRepository,
            LessonProgressRepository lessonProgressRepository,
            UserAchievementRepository userAchievementRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailTokenRepository = emailTokenRepository;
        this.gameRepository = gameRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userAchievementRepository = userAchievementRepository;
    }

    // Changes the password and signs every OTHER device out. keepRefreshToken
    // is the session making the request, so the player stays signed in here.
    @Transactional
    public void changePassword(
            Long userId,
            String currentPassword,
            String newPassword,
            String keepRefreshToken
    ) {
        User user = findUser(userId);

        requirePassword(user, currentPassword);
        PasswordPolicy.requireValid(newPassword);

        if (newPassword.equals(currentPassword)) {
            throw new IllegalArgumentException(
                    "Choose a different password from your current one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        refreshTokenService.revokeAllExcept(userId, keepRefreshToken);

        // A reset link emailed earlier must not undo this change.
        List<PasswordResetToken> pending =
                passwordResetTokenRepository.findAllByUser_IdAndUsedFalse(userId);

        for (PasswordResetToken token : pending) {
            token.setUsed(true);
        }

        passwordResetTokenRepository.saveAll(pending);
    }

    // Permanently removes the account and everything stored about it.
    @Transactional
    public void deleteAccount(Long userId, String password) {
        User user = findUser(userId);

        requirePassword(user, password);

        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new IllegalArgumentException(
                    "Admin accounts cannot be deleted here. Ask another admin to change your role first.");
        }

        refreshTokenRepository.deleteAllByUser(user);
        passwordResetTokenRepository.deleteAllByUser_Id(userId);
        emailTokenRepository.deleteAllByUser_Id(userId);
        lessonProgressRepository.deleteAllByUser_Id(userId);
        userAchievementRepository.deleteAllByUser_Id(userId);
        gameRepository.deleteAllByUser_Id(userId);

        userRepository.delete(user);
    }

    private void requirePassword(User user, String password) {
        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }
}

package com.typequest.service;

import com.typequest.model.PasswordResetToken;
import com.typequest.model.User;
import com.typequest.repository.PasswordResetTokenRepository;
import com.typequest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final String resetBaseUrl;

    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${typequest.password-reset.base-url}") String resetBaseUrl) {

        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.resetBaseUrl = resetBaseUrl;
    }

    @Transactional
    public void requestPasswordReset(String email) {

        String normalizedEmail = email.trim().toLowerCase();

        Optional<User> optionalUser =
                userRepository.findByEmail(normalizedEmail);

        // Return the same outward response whether the account exists or not.
        if (optionalUser.isEmpty()) {
            return;
        }

        User user = optionalUser.get();

        // Invalidate previous unused reset tokens.
        List<PasswordResetToken> existingTokens =
                tokenRepository.findAllByUser_IdAndUsedFalse(user.getId());

        for (PasswordResetToken token : existingTokens) {
            token.setUsed(true);
        }

        tokenRepository.saveAll(existingTokens);

        // Generate a cryptographically secure random token.
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String rawToken =
                Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(sha256(rawToken));
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        String resetLink =
                resetBaseUrl + "?token=" + rawToken;

        emailService.sendPasswordResetEmail(
                user.getEmail(),
                resetLink
        );
    }

    private String sha256(String value) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable.", exception
            );
        }
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired reset link.");
        }

        if (newPassword == null || newPassword.length() < 12) {
            throw new IllegalArgumentException(
                    "Password must contain at least 12 characters."
            );
        }

        String tokenHash = sha256(rawToken);

        PasswordResetToken resetToken = tokenRepository
                .findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired reset link."
                ));

        if (resetToken.isUsed()
                || !resetToken.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired reset link.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        // Invalidate any other unused reset tokens for this user.
        List<PasswordResetToken> otherTokens =
                tokenRepository.findAllByUser_IdAndUsedFalse(user.getId());

        for (PasswordResetToken token : otherTokens) {
            token.setUsed(true);
        }

        tokenRepository.saveAll(otherTokens);

    }
}

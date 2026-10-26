package com.typequest.service;

import com.typequest.dto.RefreshTokenResponse;
import com.typequest.model.RefreshToken;
import com.typequest.model.User;
import com.typequest.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.typequest.model.Role;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Objects;

@Service
public class RefreshTokenService {

    private static final long REFRESH_TOKEN_VALIDITY_DAYS = 7;

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtEncoder jwtEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository, JwtEncoder jwtEncoder) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtEncoder = jwtEncoder;
    }

    @Transactional
    public String createRefreshToken(User user) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash(hashToken(rawToken));
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(
                LocalDateTime.now().plusDays(REFRESH_TOKEN_VALIDITY_DAYS)
        );
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    @Transactional
    public String rotateRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Refresh token is required."
            );
        }

        String tokenHash = hashToken(rawToken);

        RefreshToken oldToken = refreshTokenRepository
                .findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid refresh token."
                        ));

        if (oldToken.isRevoked()) {
            throw new IllegalArgumentException(
                    "Refresh token has already been revoked."
            );
        }

        if (!LocalDateTime.now().isBefore(oldToken.getExpiresAt())) {
            throw new IllegalArgumentException(
                    "Refresh token has expired."
            );
        }

        // Revoke the old token within this transaction.
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        // Generate and store a replacement token.
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String newRawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        RefreshToken newToken = new RefreshToken();
        newToken.setTokenHash(hashToken(newRawToken));
        newToken.setUser(oldToken.getUser());
        newToken.setExpiresAt(
                LocalDateTime.now().plusDays(REFRESH_TOKEN_VALIDITY_DAYS)
        );
        newToken.setRevoked(false);

        refreshTokenRepository.save(newToken);

        return newRawToken;
    }

    @Transactional(readOnly = true)
    public RefreshToken validateRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Refresh token is required."
            );
        }

        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenHash(hashToken(rawToken))
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid refresh token."
                        ));

        if (refreshToken.isRevoked()) {
            throw new IllegalArgumentException(
                    "Refresh token has been revoked."
            );
        }

        if (!LocalDateTime.now().isBefore(refreshToken.getExpiresAt())) {
            throw new IllegalArgumentException(
                    "Refresh token has expired."
            );
        }

        return refreshToken;
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        refreshTokenRepository
                .findByTokenHashForUpdate(hashToken(rawToken))
                .ifPresent(refreshToken -> {
                    refreshToken.setRevoked(true);
                    refreshTokenRepository.save(refreshToken);
                });
    }

    // Signs the user out on every device except the one holding keepRawToken
    // (used after a password change). A missing or unknown token keeps nothing.
    @Transactional
    public void revokeAllExcept(Long userId, String keepRawToken) {
        String keepHash = (keepRawToken == null || keepRawToken.isBlank())
                ? "-"
                : hashToken(keepRawToken);

        refreshTokenRepository.revokeAllForUserExcept(userId, keepHash);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getEncoder()
                    .withoutPadding()
                    .encodeToString(hash);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 is not available.",
                    exception
            );
        }
    }

    @Transactional
    public RefreshTokenResponse refreshTokens(String rawToken) {

        String newRefreshToken = rotateRefreshToken(rawToken);

        RefreshToken storedToken = refreshTokenRepository
                .findByTokenHashForUpdate(hashToken(newRefreshToken))
                .orElseThrow(() ->
                        new IllegalStateException(
                                "New refresh token was not saved."
                        ));

        User user = storedToken.getUser();

        if (user.isDisabled()) {
            throw new IllegalArgumentException(
                    "This account has been disabled."
            );
        }

        // Access the user's fields while the transaction is active.
        Long userId = user.getId();
        String username = user.getUsername();
        String email = user.getEmail();
        Role role = user.getRole();

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("typequest")
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(now.plus(15, ChronoUnit.MINUTES))
                .claim("email", email)
                .claim("roles", java.util.List.of(role.name()))
                .build();

        JwsHeader header =
                JwsHeader.with(MacAlgorithm.HS256).build();

        String accessToken = jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();

        return new RefreshTokenResponse(
                accessToken,
                newRefreshToken,
                userId,
                username,
                email
        );
    }


    @Transactional
    public void revokeRefreshTokenForUser(String rawToken, Long authenticatedUserId) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required.");
        }

        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenHashForUpdate(hashToken(rawToken))
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid refresh token."));

        Long tokenOwnerId = refreshToken.getUser().getId();

        if (!Objects.equals(tokenOwnerId, authenticatedUserId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You cannot revoke another user's refresh token.");
        }

        if (refreshToken.isRevoked()) {
            // Logout is idempotent for the authenticated owner.
            return;
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }
}
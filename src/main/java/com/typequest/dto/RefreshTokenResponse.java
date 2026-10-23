package com.typequest.dto;

public record RefreshTokenResponse(
        String accessToken,
        String refreshToken,
        Long userId,
        String username,
        String email
) {
}
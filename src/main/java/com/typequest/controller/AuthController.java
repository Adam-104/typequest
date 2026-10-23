package com.typequest.controller;

import com.typequest.dto.*;
import com.typequest.model.RefreshToken;
import com.typequest.model.User;
import com.typequest.service.AuthService;
import com.typequest.service.JwtService;
import com.typequest.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthService authService, JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        String message = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new AuthResponse(message));

    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }


    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        RefreshTokenResponse response =
                refreshTokenService.refreshTokens(
                        request.getRefreshToken()
                );

        return ResponseEntity.ok(response);
    }


    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(
            @Valid @RequestBody RefreshTokenRequest request,
            Authentication authentication) {

        Long authenticatedUserId = Long.valueOf(authentication.getName());

        refreshTokenService.revokeRefreshTokenForUser(
                request.getRefreshToken(),
                authenticatedUserId
        );

        return ResponseEntity.ok(
                new AuthResponse("Logged out successfully.")
        );
    }
}
package com.typequest.controller;

import com.typequest.dto.AuthResponse;
import com.typequest.service.AccountService;
import com.typequest.service.EmailVerificationService;
import com.typequest.service.RateLimitService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

// Account settings for the signed-in player.
@RestController
@RequestMapping("/api/account")
public class AccountController {

    // Anything that asks for the password is limited per player, so a stolen
    // access token cannot be used to guess the password.
    private static final int PASSWORD_ATTEMPTS = 10;
    private static final int RESEND_ATTEMPTS = 3;

    private final AccountService accountService;
    private final EmailVerificationService emailVerificationService;
    private final RateLimitService rateLimitService;

    public AccountController(
            AccountService accountService,
            EmailVerificationService emailVerificationService,
            RateLimitService rateLimitService
    ) {
        this.accountService = accountService;
        this.emailVerificationService = emailVerificationService;
        this.rateLimitService = rateLimitService;
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Enter your current password.")
            @Size(max = 72, message = "Password is too long.")
            String currentPassword,

            @NotBlank(message = "Enter a new password.")
            @Size(min = 12, max = 72, message = "Password must be 12–72 characters.")
            String newPassword,

            // The session making the request; it stays signed in.
            @Size(max = 200)
            String refreshToken
    ) {
    }

    public record ChangeEmailRequest(
            @NotBlank(message = "Enter your current password.")
            @Size(max = 72, message = "Password is too long.")
            String currentPassword,

            @NotBlank(message = "Enter the new email address.")
            @Email(message = "Enter a valid email address")
            @Size(max = 150)
            String newEmail
    ) {
    }

    public record DeleteAccountRequest(
            @NotBlank(message = "Enter your password to confirm.")
            @Size(max = 72, message = "Password is too long.")
            String password
    ) {
    }

    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        Long userId = Long.valueOf(jwt.getSubject());

        limit("password", userId, PASSWORD_ATTEMPTS);

        accountService.changePassword(
                userId,
                request.currentPassword(),
                request.newPassword(),
                request.refreshToken()
        );

        return ResponseEntity.ok(new AuthResponse(
                "Password changed. Your other devices were signed out."));
    }

    @PostMapping("/change-email")
    public ResponseEntity<AuthResponse> changeEmail(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangeEmailRequest request
    ) {
        Long userId = Long.valueOf(jwt.getSubject());

        limit("password", userId, PASSWORD_ATTEMPTS);

        emailVerificationService.requestEmailChange(
                userId, request.currentPassword(), request.newEmail());

        return ResponseEntity.ok(new AuthResponse(
                "We sent a confirmation link to the new address. Your email changes when you click it."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<AuthResponse> resendVerification(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());

        limit("resend", userId, RESEND_ATTEMPTS);

        emailVerificationService.resend(userId);

        return ResponseEntity.ok(new AuthResponse("Confirmation email sent."));
    }

    @PostMapping("/delete")
    public ResponseEntity<AuthResponse> deleteAccount(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DeleteAccountRequest request
    ) {
        Long userId = Long.valueOf(jwt.getSubject());

        limit("password", userId, PASSWORD_ATTEMPTS);

        accountService.deleteAccount(userId, request.password());

        return ResponseEntity.ok(new AuthResponse("Your account has been deleted."));
    }

    private void limit(String action, Long userId, int attempts) {
        if (!rateLimitService.isAllowed("account-" + action + ":" + userId, attempts)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many attempts. Please try again later."
            );
        }
    }
}

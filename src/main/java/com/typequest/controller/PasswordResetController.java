package com.typequest.controller;

import com.typequest.service.PasswordResetService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {
    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email
    ) {}

    public record ResetPasswordRequest(
            @jakarta.validation.constraints.NotBlank
            String token,

            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Size(min = 12, max = 128)
            String newPassword
    ) {}

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @jakarta.validation.Valid
            @RequestBody ForgotPasswordRequest request) {

        passwordResetService.requestPasswordReset(request.email());

        return ResponseEntity.ok(
                "If an account exists with that email, password-reset instructions will be sent."
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @jakarta.validation.Valid
            @RequestBody ResetPasswordRequest request) {

        passwordResetService.resetPassword(
                request.token(),
                request.newPassword()
        );

        return ResponseEntity.ok(
                "Password reset successfully. Please log in with your new password."
        );
    }
}

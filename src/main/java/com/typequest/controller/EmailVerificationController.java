package com.typequest.controller;

import com.typequest.dto.AuthResponse;
import com.typequest.model.EmailToken;
import com.typequest.service.EmailVerificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Public: the player opens the emailed link, possibly on another device and
// without being signed in.
@RestController
@RequestMapping("/api/auth")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    public EmailVerificationController(EmailVerificationService emailVerificationService) {
        this.emailVerificationService = emailVerificationService;
    }

    public record VerifyEmailRequest(
            @NotBlank(message = "Invalid or expired link.")
            @Size(max = 100, message = "Invalid or expired link.")
            String token
    ) {
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        String purpose = emailVerificationService.confirm(request.token());

        return ResponseEntity.ok(new AuthResponse(
                EmailToken.CHANGE.equals(purpose)
                        ? "Your new email address is confirmed."
                        : "Your email address is confirmed."
        ));
    }
}

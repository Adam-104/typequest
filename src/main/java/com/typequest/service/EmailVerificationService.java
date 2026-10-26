package com.typequest.service;

import com.typequest.exception.EmailAlreadyExistsException;
import com.typequest.model.EmailToken;
import com.typequest.model.User;
import com.typequest.repository.EmailTokenRepository;
import com.typequest.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

// Confirming an email address, and changing it. Both work by emailing a
// single-use link.
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final int LINK_HOURS = 24;

    private final EmailTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final String verifyBaseUrl;

    public EmailVerificationService(
            EmailTokenRepository tokenRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${typequest.email-verification.base-url:http://localhost:5173/verify-email}")
            String verifyBaseUrl
    ) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.verifyBaseUrl = verifyBaseUrl;
    }

    // Sends the "confirm your email" link. A mail failure is logged, never
    // thrown: signing up must not fail because the mail server is down (the
    // player can ask for another link from Settings).
    @Transactional
    public void sendVerification(User user) {
        if (user.isEmailVerified()) {
            return;
        }

        String raw = issue(user, EmailToken.VERIFY, null);

        try {
            emailService.sendVerificationEmail(user.getEmail(), link(raw));
        } catch (MailException exception) {
            log.warn("Could not send verification email to user {}: {}",
                    user.getId(), exception.getMessage());
        }
    }

    @Transactional
    public void resend(Long userId) {
        User user = findUser(userId);

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Your email is already confirmed.");
        }

        sendVerification(user);
    }

    // Starts an email change: the link goes to the NEW address, and the
    // account keeps the old one until it is clicked.
    @Transactional
    public void requestEmailChange(Long userId, String currentPassword, String newEmail) {
        User user = findUser(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        String email = newEmail.trim().toLowerCase(Locale.ROOT);

        if (email.equals(user.getEmail())) {
            throw new IllegalArgumentException("That is already your email address.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("An account with this email already exists.");
        }

        String raw = issue(user, EmailToken.CHANGE, email);

        try {
            emailService.sendEmailChangeEmail(email, link(raw));
        } catch (MailException exception) {
            log.warn("Could not send email-change mail for user {}: {}",
                    user.getId(), exception.getMessage());

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "We could not send the confirmation email. Please try again later.");
        }
    }

    // Returns EmailToken.VERIFY or EmailToken.CHANGE, so the page can say
    // what happened.
    @Transactional
    public String confirm(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired link.");
        }

        EmailToken token = tokenRepository
                .findByTokenHashForUpdate(TokenHashing.sha256Hex(rawToken))
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired link."));

        if (token.isUsed() || !token.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired link.");
        }

        User user = token.getUser();

        if (EmailToken.CHANGE.equals(token.getPurpose())) {
            if (userRepository.existsByEmail(token.getNewEmail())) {
                throw new EmailAlreadyExistsException("An account with this email already exists.");
            }

            user.setEmail(token.getNewEmail());
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        return token.getPurpose();
    }

    // Creates a new token and retires older unused ones of the same kind.
    private String issue(User user, String purpose, String newEmail) {
        List<EmailToken> older =
                tokenRepository.findAllByUser_IdAndPurposeAndUsedFalse(user.getId(), purpose);

        for (EmailToken old : older) {
            old.setUsed(true);
        }

        tokenRepository.saveAll(older);

        String raw = TokenHashing.newRawToken();

        EmailToken token = new EmailToken();

        token.setUser(user);
        token.setPurpose(purpose);
        token.setNewEmail(newEmail);
        token.setTokenHash(TokenHashing.sha256Hex(raw));
        token.setExpiresAt(LocalDateTime.now().plusHours(LINK_HOURS));
        tokenRepository.save(token);

        return raw;
    }

    private String link(String rawToken) {
        return verifyBaseUrl + "?token=" + rawToken;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }
}

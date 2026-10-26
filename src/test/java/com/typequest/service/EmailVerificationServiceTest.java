package com.typequest.service;

import com.typequest.exception.EmailAlreadyExistsException;
import com.typequest.model.EmailToken;
import com.typequest.model.User;
import com.typequest.repository.EmailTokenRepository;
import com.typequest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailVerificationServiceTest {

    private EmailTokenRepository tokenRepository;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private EmailService emailService;
    private EmailVerificationService service;
    private User user;

    @BeforeEach
    void setUp() {
        tokenRepository = mock(EmailTokenRepository.class);
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        emailService = mock(EmailService.class);

        service = new EmailVerificationService(
                tokenRepository, userRepository, passwordEncoder, emailService,
                "http://localhost:5173/verify-email");

        user = new User();
        user.setId(5L);
        user.setEmail("ace@example.com");
        user.setPassword("hash");

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(tokenRepository.findAllByUser_IdAndPurposeAndUsedFalse(any(), anyString()))
                .thenReturn(List.of());
    }

    private EmailToken tokenFor(String raw, String purpose, String newEmail) {
        EmailToken token = new EmailToken();

        token.setUser(user);
        token.setPurpose(purpose);
        token.setNewEmail(newEmail);
        token.setExpiresAt(LocalDateTime.now().plusHours(1));

        when(tokenRepository.findByTokenHashForUpdate(TokenHashing.sha256Hex(raw)))
                .thenReturn(Optional.of(token));

        return token;
    }

    @Test
    void sendVerificationStoresOnlyAHashAndEmailsTheRawLink() {
        service.sendVerification(user);

        ArgumentCaptor<EmailToken> saved = ArgumentCaptor.forClass(EmailToken.class);
        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);

        verify(tokenRepository).save(saved.capture());
        verify(emailService).sendVerificationEmail(eq("ace@example.com"), link.capture());

        String raw = link.getValue().substring(link.getValue().indexOf("token=") + 6);

        assertEquals(TokenHashing.sha256Hex(raw), saved.getValue().getTokenHash());
        assertEquals(EmailToken.VERIFY, saved.getValue().getPurpose());
    }

    @Test
    void mailFailureDoesNotBreakSignUp() {
        doThrow(new MailSendException("smtp down"))
                .when(emailService).sendVerificationEmail(anyString(), anyString());

        service.sendVerification(user); // must not throw
    }

    @Test
    void alreadyVerifiedUsersGetNoEmail() {
        user.setEmailVerified(true);

        service.sendVerification(user);

        verify(emailService, never()).sendVerificationEmail(anyString(), anyString());
    }

    @Test
    void confirmingAVerifyLinkMarksTheEmailVerified() {
        EmailToken token = tokenFor("raw", EmailToken.VERIFY, null);

        assertEquals(EmailToken.VERIFY, service.confirm("raw"));

        assertTrue(user.isEmailVerified());
        assertTrue(token.isUsed());
    }

    @Test
    void usedOrExpiredLinksAreRejected() {
        EmailToken used = tokenFor("used", EmailToken.VERIFY, null);
        used.setUsed(true);

        EmailToken expired = tokenFor("old", EmailToken.VERIFY, null);
        expired.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        assertThrows(IllegalArgumentException.class, () -> service.confirm("used"));
        assertThrows(IllegalArgumentException.class, () -> service.confirm("old"));
        assertThrows(IllegalArgumentException.class, () -> service.confirm("unknown"));
        assertFalse(user.isEmailVerified());
    }

    @Test
    void confirmingAChangeLinkSwitchesTheAddress() {
        tokenFor("raw", EmailToken.CHANGE, "new@example.com");

        assertEquals(EmailToken.CHANGE, service.confirm("raw"));

        assertEquals("new@example.com", user.getEmail());
        assertTrue(user.isEmailVerified());
    }

    @Test
    void changeLinkFailsIfSomeoneTookTheAddressMeanwhile() {
        tokenFor("raw", EmailToken.CHANGE, "new@example.com");
        when(userRepository.existsByEmail("new@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> service.confirm("raw"));
        assertEquals("ace@example.com", user.getEmail());
    }

    @Test
    void emailChangeNeedsTheCurrentPassword() {
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> service.requestEmailChange(5L, "wrong", "new@example.com"));

        verify(emailService, never()).sendEmailChangeEmail(anyString(), anyString());
    }

    @Test
    void emailChangeSendsTheLinkToTheNewAddressOnly() {
        when(passwordEncoder.matches("right", "hash")).thenReturn(true);

        service.requestEmailChange(5L, "right", "  NEW@Example.com ");

        verify(emailService).sendEmailChangeEmail(eq("new@example.com"), anyString());
        assertEquals("ace@example.com", user.getEmail()); // unchanged until confirmed
    }

    @Test
    void emailChangeToATakenAddressIsRejected() {
        when(passwordEncoder.matches("right", "hash")).thenReturn(true);
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class,
                () -> service.requestEmailChange(5L, "right", "taken@example.com"));
    }
}

package com.typequest;

import com.typequest.dto.RegisterRequest;
import com.typequest.exception.EmailAlreadyExistsException;
import com.typequest.exception.UsernameAlreadyExistsException;
import com.typequest.model.User;
import com.typequest.repository.UserRepository;
import com.typequest.service.AuthService;
import com.typequest.service.JwtService;
import com.typequest.service.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceRegisterTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.encode(any())).thenReturn("hash");

        authService = new AuthService(
                userRepository,
                passwordEncoder,
                mock(JwtService.class),
                mock(RefreshTokenService.class)
        );
    }

    private RegisterRequest request(String username, String email, String password) {
        RegisterRequest request = new RegisterRequest();

        request.setUsername(username);
        request.setEmail(email);
        request.setPassword(password);

        return request;
    }

    @Test
    void validRegistrationSavesTrimmedUsernameAndLowercaseEmail() {
        authService.register(request("  Ace  ", "ACE@Example.com", "a-long-password"));

        org.mockito.ArgumentCaptor<User> saved = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());

        assertEquals("Ace", saved.getValue().getUsername());
        assertEquals("ace@example.com", saved.getValue().getEmail());
    }

    @Test
    void takenUsernameIsRejectedWhateverTheCapitalisation() {
        when(userRepository.existsByUsernameIgnoreCase("ace")).thenReturn(true);

        assertThrows(UsernameAlreadyExistsException.class,
                () -> authService.register(request("ace", "new@example.com", "a-long-password")));

        verify(userRepository, never()).save(any());
    }

    @Test
    void shortPasswordIsRejectedBeforeAnythingIsSaved() {
        assertThrows(IllegalArgumentException.class,
                () -> authService.register(request("ace", "new@example.com", "short-pw")));

        verify(userRepository, never()).save(any());
    }

    @Test
    void raceOnUsernameIsReportedAsUsernameTaken() {
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException(
                "x", new RuntimeException("Duplicate entry 'ace' for key 'users.uk_users_username'")));

        assertThrows(UsernameAlreadyExistsException.class,
                () -> authService.register(request("ace", "new@example.com", "a-long-password")));
    }

    @Test
    void raceOnEmailIsReportedAsEmailTaken() {
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException(
                "x", new RuntimeException("Duplicate entry 'a@b.c' for key 'users.uk_users_email'")));

        assertThrows(EmailAlreadyExistsException.class,
                () -> authService.register(request("ace", "new@example.com", "a-long-password")));
    }
}

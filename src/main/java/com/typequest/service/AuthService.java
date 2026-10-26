package com.typequest.service;

import com.typequest.dto.RegisterRequest;
import com.typequest.exception.EmailAlreadyExistsException;
import com.typequest.exception.UsernameAlreadyExistsException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import com.typequest.exception.InvalidCredentialsException;
import com.typequest.model.Role;
import com.typequest.model.User;
import com.typequest.repository.UserRepository;
import com.typequest.dto.AuthResponse;
import com.typequest.dto.LoginRequest;
import com.typequest.service.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    // Optional so AuthService can still be built by hand in unit tests.
    @Autowired(required = false)
    private EmailVerificationService emailVerificationService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public String register(RegisterRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        String username = request.getUsername().trim();

        PasswordPolicy.requireValid(request.getPassword());

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(
                    "An account with this email already exists."
            );
        }

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new UsernameAlreadyExistsException(
                    "This username is already taken."
            );
        }

        User user = new User();

        user.setUsername(username);
        user.setEmail(email);

        // Store the BCrypt hash, never the original password.
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        // Set the every user as user default
        user.setRole(Role.ROLE_USER);

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            // Two sign-ups raced past the checks above; the database
            // constraints are the last line of defence.
            String detail = String.valueOf(exception.getMostSpecificCause().getMessage())
                    .toLowerCase(Locale.ROOT);

            if (detail.contains("uk_users_username")) {
                throw new UsernameAlreadyExistsException(
                        "This username is already taken."
                );
            }

            throw new EmailAlreadyExistsException(
                    "An account with this email already exists."
            );
        }

        if (emailVerificationService != null) {
            emailVerificationService.sendVerification(user);
        }

        return "Account registered successfully!";
    }

    @Transactional(noRollbackFor = InvalidCredentialsException.class)
    public AuthResponse login(LoginRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Invalid email or password."
                ));

        LocalDateTime now = LocalDateTime.now();

        // Reject login while the account is temporarily locked.
        if (user.getLockedUntil() != null) {

            if (now.isBefore(user.getLockedUntil())) {
                throw new InvalidCredentialsException(
                        "Invalid email or password."
                );
            }

            // The lock has expired. Reset the previous failure counter.
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
        }

        // Check the supplied password.
        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            int failedAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failedAttempts);

            // Lock the account after five consecutive failed attempts.
            if (failedAttempts >= 5) {
                user.setLockedUntil(now.plusMinutes(15));
                user.setFailedLoginAttempts(0);
            }

            userRepository.save(user);

            throw new InvalidCredentialsException(
                    "Invalid email or password."
            );
        }

        // Correct password, but an admin has switched the account off.
        if (user.isDisabled()) {
            throw new InvalidCredentialsException(
                    "This account has been disabled. Please contact support."
            );
        }

        // Successful login clears the failure counter.
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        String refreshToken = refreshTokenService.createRefreshToken(user);

        AuthResponse response = new AuthResponse(
                "Login successful!",
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail()
        );

        response.setRefreshToken(refreshToken);

        return response;
    }
}
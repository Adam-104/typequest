package com.typequest.integration;

import com.typequest.model.Role;
import com.typequest.model.User;
import com.typequest.repository.UserRepository;
import com.typequest.service.AuthService;
import com.typequest.dto.LoginRequest;
import com.typequest.exception.InvalidCredentialsException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.typequest.repository.RefreshTokenRepository;
import org.springframework.transaction.support.TransactionTemplate;


import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "typequest.admin.initializer.enabled=false",
        "MAIL_HOST=localhost",
        "MAIL_PORT=587",
        "MAIL_USERNAME=test",
        "MAIL_PASSWORD=test",
        "MAIL_FROM=test@example.com",
        "typequest.jwt.secret=VGhpc0lzQVRlc3RTZWNyZXRLZXlUaGF0SXNMb25nRW5vdWdoIQ==",
        "spring.datasource.url=jdbc:mysql://localhost:3306/typequest_db",
        "spring.datasource.username=root",
        "spring.datasource.password=root"
})
class AccountLockoutIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private String testEmail;

    @BeforeEach
    void setUp() {
        testEmail = "lockout-test-" + System.nanoTime() + "@example.com";

        User user = new User();
        user.setUsername("lockout-test");
        user.setEmail(testEmail);
        user.setPassword(passwordEncoder.encode("CorrectPassword123!"));
        user.setRole(Role.ROLE_USER);

        userRepository.saveAndFlush(user);
    }

    @AfterEach
    void cleanUp() {
        if (testEmail == null) {
            return;
        }

        transactionTemplate.executeWithoutResult(status -> {
            userRepository.findByEmail(testEmail)
                    .ifPresent(user -> {
                        refreshTokenRepository.deleteAllByUser(user);
                        userRepository.delete(user);
                    });
        });
    }

    @Test
    void failedLoginAttemptPersistsInDatabase() {
        LoginRequest request = new LoginRequest();
        request.setEmail(testEmail);
        request.setPassword("WrongPassword123!");

        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(request)
        );

        User savedUser = userRepository.findByEmail(testEmail)
                .orElseThrow();

        assertEquals(1, savedUser.getFailedLoginAttempts());
        assertNull(savedUser.getLockedUntil());
    }


    @Test
    void fifthFailedLoginAttemptLocksAccountInDatabase() {

        LoginRequest request = new LoginRequest();
        request.setEmail(testEmail);
        request.setPassword("WrongPassword123!");

        // First four failed attempts.
        for (int i = 1; i <= 4; i++) {
            assertThrows(
                    InvalidCredentialsException.class,
                    () -> authService.login(request)
            );

            User savedUser = userRepository.findByEmail(testEmail)
                    .orElseThrow();

            assertEquals(i, savedUser.getFailedLoginAttempts());
            assertNull(savedUser.getLockedUntil());
        }

        // Fifth failed attempt should lock the account.
        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(request)
        );

        User lockedUser = userRepository.findByEmail(testEmail)
                .orElseThrow();

        assertEquals(0, lockedUser.getFailedLoginAttempts());
        assertNotNull(lockedUser.getLockedUntil());
        assertTrue(lockedUser.getLockedUntil().isAfter(
                java.time.LocalDateTime.now()
        ));

        // Further login attempts must be rejected while locked.
        LoginRequest correctRequest = new LoginRequest();
        correctRequest.setEmail(testEmail);
        correctRequest.setPassword("CorrectPassword123!");

        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(correctRequest)
        );
    }

    @Test
    void expiredLockAllowsSuccessfulLogin() {
        User user = userRepository.findByEmail(testEmail)
                .orElseThrow();

        // Simulate an expired account lock.
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(
                java.time.LocalDateTime.now().minusMinutes(1)
        );

        userRepository.saveAndFlush(user);

        LoginRequest request = new LoginRequest();
        request.setEmail(testEmail);
        request.setPassword("CorrectPassword123!");

        // Login should succeed after the lock expires.
        var response = authService.login(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertNotNull(response.getRefreshToken());

        User updatedUser = userRepository.findByEmail(testEmail)
                .orElseThrow();

        assertEquals(0, updatedUser.getFailedLoginAttempts());
        assertNull(updatedUser.getLockedUntil());
    }


    @Test
    void concurrentFailedLoginAttemptsLockAccount() throws Exception {
        int concurrentAttempts = 5;

        ExecutorService executor =
                Executors.newFixedThreadPool(concurrentAttempts);

        CountDownLatch readyLatch = new CountDownLatch(concurrentAttempts);
        CountDownLatch startLatch = new CountDownLatch(1);

        try {
            List<Future<Boolean>> results = new ArrayList<>();

            for (int i = 0; i < concurrentAttempts; i++) {
                results.add(executor.submit(() -> {
                    readyLatch.countDown();

                    // Wait until all five tasks are ready.
                    if (!startLatch.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException(
                                "Timed out waiting for the concurrent test to start"
                        );
                    }

                    LoginRequest request = new LoginRequest();
                    request.setEmail(testEmail);
                    request.setPassword("WrongPassword123!");

                    try {
                        authService.login(request);
                        return false;
                    } catch (InvalidCredentialsException exception) {
                        return true;
                    }
                }));
            }

            // Wait until all five tasks are ready to start.
            assertTrue(
                    readyLatch.await(10, TimeUnit.SECONDS),
                    "Not all login tasks became ready"
            );

            // Release all five tasks together.
            startLatch.countDown();

            // Every incorrect-password attempt should be rejected.
            for (Future<Boolean> result : results) {
                assertTrue(
                        result.get(30, TimeUnit.SECONDS),
                        "An incorrect-password login unexpectedly succeeded"
                );
            }

            User savedUser = userRepository.findByEmail(testEmail)
                    .orElseThrow();

            assertNotNull(
                    savedUser.getLockedUntil(),
                    "The account should be locked after five failed attempts"
            );

            assertTrue(
                    savedUser.getLockedUntil().isAfter(
                            java.time.LocalDateTime.now()
                    ),
                    "The account lock should still be active"
            );

            assertEquals(
                    0,
                    savedUser.getFailedLoginAttempts(),
                    "The counter should reset when the account locks"
            );
        } finally {
            // Prevent waiting tasks from being left behind if an assertion fails.
            startLatch.countDown();

            executor.shutdownNow();
            executor.awaitTermination(5, TimeUnit.SECONDS);
        }
    }
}
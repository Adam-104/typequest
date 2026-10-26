package com.typequest.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitServiceTest {

    private RateLimitService rateLimitService;

    private AtomicReference<Instant> currentTime;

    @BeforeEach
    void setUp() {
        currentTime = new AtomicReference<>(
                Instant.parse("2026-10-23T10:00:00Z")
        );

        Clock testClock = new Clock() {

            @Override
            public ZoneOffset getZone() {
                return ZoneOffset.UTC;
            }

            @Override
            public Clock withZone(java.time.ZoneId zone) {
                return this;
            }

            @Override
            public Instant instant() {
                return currentTime.get();
            }
        };

        rateLimitService = new RateLimitService(testClock);
    }

    @Test
    void firstRequestIsAllowed() {
        assertTrue(rateLimitService.isAllowed("client-1"));
    }

    @Test
    void fifthRequestIsAllowed() {
        String key = "client-2";

        for (int i = 0; i < 4; i++) {
            rateLimitService.isAllowed(key);
        }

        assertTrue(rateLimitService.isAllowed(key));
    }

    @Test
    void sixthRequestIsRejected() {
        String key = "client-3";

        for (int i = 0; i < 5; i++) {
            rateLimitService.isAllowed(key);
        }

        assertFalse(rateLimitService.isAllowed(key));
    }

    @Test
    void subsequentRequestsRemainRejectedWithinWindow() {
        String key = "client-4";

        for (int i = 0; i < 5; i++) {
            rateLimitService.isAllowed(key);
        }

        assertFalse(rateLimitService.isAllowed(key));
        assertFalse(rateLimitService.isAllowed(key));
        assertFalse(rateLimitService.isAllowed(key));
    }

    @Test
    void differentKeysHaveIndependentLimits() {
        String firstKey = "client-A";
        String secondKey = "client-B";

        for (int i = 0; i < 5; i++) {
            assertTrue(rateLimitService.isAllowed(firstKey));
        }

        assertFalse(rateLimitService.isAllowed(firstKey));
        assertTrue(rateLimitService.isAllowed(secondKey));
    }

    @Test
    void requestsAreAllowedAgainAfter15Minutes() {
        String key = "client-5";

        // Use all five allowed requests.
        for (int i = 0; i < 5; i++) {
            assertTrue(rateLimitService.isAllowed(key));
        }

        // The sixth request must be rejected.
        assertFalse(rateLimitService.isAllowed(key));

        // Advance the clock by exactly 15 minutes.
        currentTime.updateAndGet(
                time -> time.plus(Duration.ofMinutes(15))
        );

        // The rate-limit window has expired.
        assertTrue(rateLimitService.isAllowed(key));
    }

    @Test
    void cleanupRemovesExpiredEntries() {
        String key = "client-cleanup";

        for (int i = 0; i < 5; i++) {
            assertTrue(rateLimitService.isAllowed(key));
        }

        assertFalse(rateLimitService.isAllowed(key));

        // Advance time beyond the 15-minute window.
        currentTime.updateAndGet(
                time -> time.plus(Duration.ofMinutes(16))
        );

        rateLimitService.cleanupExpiredEntries();

        // The expired entry has been removed, so a new window starts.
        assertTrue(rateLimitService.isAllowed(key));
    }

    @Test
    void cleanupPreservesActiveEntries() {
        String key = "client-active";

        for (int i = 0; i < 5; i++) {
            assertTrue(rateLimitService.isAllowed(key));
        }

        assertFalse(rateLimitService.isAllowed(key));

        // Advance time by only 10 minutes.
        currentTime.updateAndGet(
                time -> time.plus(Duration.ofMinutes(10))
        );

        rateLimitService.cleanupExpiredEntries();

        // The original window is still active and its limit remains exhausted.
        assertFalse(rateLimitService.isAllowed(key));
    }

    @Test
    void customLimitAllowsThatManyAttempts() {
        String key = "classroom";

        for (int i = 0; i < 20; i++) {
            assertTrue(rateLimitService.isAllowed(key, 20));
        }

        assertFalse(rateLimitService.isAllowed(key, 20));
    }
}

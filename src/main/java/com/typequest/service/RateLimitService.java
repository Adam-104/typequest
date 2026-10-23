package com.typequest.service;

import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.scheduling.annotation.Scheduled;
import java.util.Map;

@Service
public class RateLimitService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final ConcurrentHashMap<String, AttemptWindow> attempts =
            new ConcurrentHashMap<>();

    private final Clock clock;

    public RateLimitService() {
        this(Clock.systemUTC());
    }

    // Allows tests to provide a controllable clock.
    RateLimitService(Clock clock) {
        this.clock = clock;
    }

    public boolean isAllowed(String key) {
        Instant now = clock.instant();

        AttemptWindow window = attempts.compute(key, (ignored, current) -> {
            if (current == null ||
                    !now.isBefore(current.startedAt.plus(WINDOW))) {
                return new AttemptWindow(now, new AtomicInteger(1));
            }

            current.count.incrementAndGet();
            return current;
        });

        return window.count.get() <= MAX_ATTEMPTS;
    }

    @Scheduled(fixedDelay = 60_000)
    public void cleanupExpiredEntries() {
        Instant now = clock.instant();

        for (Map.Entry<String, AttemptWindow> entry : attempts.entrySet()) {
            AttemptWindow window = entry.getValue();

            if (!now.isBefore(window.startedAt.plus(WINDOW))) {
                attempts.remove(entry.getKey(), window);
            }
        }
    }

    private static class AttemptWindow {

        private final Instant startedAt;
        private final AtomicInteger count;

        private AttemptWindow(Instant startedAt, AtomicInteger count) {
            this.startedAt = startedAt;
            this.count = count;
        }
    }
}
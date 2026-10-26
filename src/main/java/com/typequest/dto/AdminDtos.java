package com.typequest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

// Request and response shapes for /api/admin.
public final class AdminDtos {

    private AdminDtos() {
    }

    public record RecentGame(
            Long id,
            String username,
            String gameType,
            Integer wpm,
            Double accuracy,
            LocalDateTime playedAt
    ) {
    }

    public record Stats(
            long totalUsers,
            long newUsersLast7Days,
            long disabledUsers,
            long totalGames,
            long gamesLast7Days,
            double averageWpm,
            double averageAccuracy,
            long lessonsCompleted,
            Map<String, Long> gamesByType,
            List<RecentGame> recentGames
    ) {
    }

    public record UserRow(
            Long id,
            String username,
            String email,
            String role,
            int level,
            int totalXp,
            LocalDateTime createdAt,
            boolean disabled,
            boolean leaderboardBanned,
            boolean locked
    ) {
    }

    public record PageOf<T>(
            List<T> items,
            int page,
            int size,
            long total
    ) {
    }

    // Every field is optional: only the ones sent are changed.
    public record UserUpdate(
            Boolean disabled,
            Boolean leaderboardBanned,
            @Pattern(regexp = "ROLE_USER|ROLE_ADMIN", message = "Role must be ROLE_USER or ROLE_ADMIN.")
            String role
    ) {
    }

    public record GameRow(
            Long id,
            Long userId,
            String username,
            String gameType,
            String difficulty,
            Integer wpm,
            Double accuracy,
            Integer durationSeconds,
            Integer score,
            LocalDateTime playedAt
    ) {
    }

    public record AchievementUpdate(
            @NotBlank(message = "Name is required.")
            @Size(max = 100, message = "Name cannot exceed 100 characters.")
            String name,

            @Size(max = 500, message = "Description cannot exceed 500 characters.")
            String description,

            @Size(max = 20, message = "Icon cannot exceed 20 characters.")
            String icon,

            Integer xpReward
    ) {
    }

    public record PassageRow(
            Long id,
            String category,
            String text,
            boolean active,
            LocalDateTime createdAt
    ) {
    }

    public record PassageInput(
            @NotBlank(message = "Category is required.")
            @Pattern(regexp = "SPEED|RACE", message = "Category must be SPEED or RACE.")
            String category,

            @NotBlank(message = "Text is required.")
            @Size(min = 20, max = 1000, message = "Text must be between 20 and 1000 characters.")
            String text,

            Boolean active
    ) {
    }

    public record PassageImport(
            List<@jakarta.validation.Valid PassageInput> passages
    ) {
    }

    public record ImportResult(int added, int skipped) {
    }
}

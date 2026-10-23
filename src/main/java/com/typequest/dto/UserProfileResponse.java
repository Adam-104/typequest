package com.typequest.dto;

import java.time.LocalDateTime;

public class UserProfileResponse {

    private String username;
    private String email;
    private int totalXp;
    private int level;
    private long gamesPlayed;
    private long achievementsUnlocked;
    private LocalDateTime memberSince;

    public UserProfileResponse(
            String username,
            String email,
            int totalXp,
            int level,
            long gamesPlayed,
            long achievementsUnlocked,
            LocalDateTime memberSince
    ) {
        this.username = username;
        this.email = email;
        this.totalXp = totalXp;
        this.level = level;
        this.gamesPlayed = gamesPlayed;
        this.achievementsUnlocked = achievementsUnlocked;
        this.memberSince = memberSince;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public int getTotalXp() {
        return totalXp;
    }

    public int getLevel() {
        return level;
    }

    public long getGamesPlayed() {
        return gamesPlayed;
    }

    public long getAchievementsUnlocked() {
        return achievementsUnlocked;
    }

    public LocalDateTime getMemberSince() {
        return memberSince;
    }
}
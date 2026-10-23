package com.typequest.dto;

public class LeaderboardResponse {

    private int rank;
    private String username;
    private int totalXp;
    private int level;

    public LeaderboardResponse(
            int rank,
            String username,
            int totalXp,
            int level
    ) {
        this.rank = rank;
        this.username = username;
        this.totalXp = totalXp;
        this.level = level;
    }

    public int getRank() {
        return rank;
    }

    public String getUsername() {
        return username;
    }

    public int getTotalXp() {
        return totalXp;
    }

    public int getLevel() {
        return level;
    }
}
package com.typequest.dto;

import java.time.LocalDateTime;

public class MyAchievementResponse {

    private String code;
    private String name;
    private String description;
    private String icon;
    private int xpReward;
    private LocalDateTime unlockedAt;

    public MyAchievementResponse(
            String code,
            String name,
            String description,
            String icon,
            int xpReward,
            LocalDateTime unlockedAt
    ) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.xpReward = xpReward;
        this.unlockedAt = unlockedAt;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getIcon() {
        return icon;
    }

    public int getXpReward() {
        return xpReward;
    }

    public LocalDateTime getUnlockedAt() {
        return unlockedAt;
    }
}

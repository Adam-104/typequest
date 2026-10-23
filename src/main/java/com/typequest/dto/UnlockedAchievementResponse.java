package com.typequest.dto;

public class UnlockedAchievementResponse {

    private String code;
    private String name;
    private String description;
    private String icon;
    private int xpReward;

    public UnlockedAchievementResponse() {
    }

    public UnlockedAchievementResponse(
            String code,
            String name,
            String description,
            String icon,
            int xpReward
    ) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.xpReward = xpReward;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public int getXpReward() {
        return xpReward;
    }

    public void setXpReward(int xpReward) {
        this.xpReward = xpReward;
    }
}
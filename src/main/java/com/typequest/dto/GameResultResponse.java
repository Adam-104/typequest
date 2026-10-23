package com.typequest.dto;

import java.util.ArrayList;
import java.util.List;

public class GameResultResponse {

    private String message;
    private double wpm;
    private double accuracy;
    private int score;

    private int earnedXp;
    private int totalXp;
    private int level;
    private boolean levelUp;

    private List<UnlockedAchievementResponse> unlockedAchievements =
            new ArrayList<>();

    public GameResultResponse() {
    }

    public GameResultResponse(
            String message,
            double wpm,
            double accuracy,
            int score
    ) {
        this.message = message;
        this.wpm = wpm;
        this.accuracy = accuracy;
        this.score = score;
    }

    public GameResultResponse(
            String message,
            double wpm,
            double accuracy,
            int score,
            int earnedXp,
            int totalXp,
            int level,
            boolean levelUp
    ) {
        this.message = message;
        this.wpm = wpm;
        this.accuracy = accuracy;
        this.score = score;
        this.earnedXp = earnedXp;
        this.totalXp = totalXp;
        this.level = level;
        this.levelUp = levelUp;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public double getWpm() {
        return wpm;
    }

    public void setWpm(double wpm) {
        this.wpm = wpm;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getEarnedXp() {
        return earnedXp;
    }

    public void setEarnedXp(int earnedXp) {
        this.earnedXp = earnedXp;
    }

    public int getTotalXp() {
        return totalXp;
    }

    public void setTotalXp(int totalXp) {
        this.totalXp = totalXp;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public boolean isLevelUp() {
        return levelUp;
    }

    public void setLevelUp(boolean levelUp) {
        this.levelUp = levelUp;
    }

    public List<UnlockedAchievementResponse> getUnlockedAchievements() {
        return unlockedAchievements;
    }

    public void setUnlockedAchievements(
            List<UnlockedAchievementResponse> unlockedAchievements
    ) {
        this.unlockedAchievements = unlockedAchievements;
    }
}

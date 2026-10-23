package com.typequest.dto;

import java.time.LocalDateTime;

public class GameHistoryResponse {

    private Long id;
    private String gameType;
    private String difficulty;
    private double wpm;
    private double accuracy;
    private int correctCharacters;
    private int incorrectCharacters;
    private int durationSeconds;
    private int score;
    private LocalDateTime playedAt;

    public GameHistoryResponse() {
    }

    public GameHistoryResponse(
            Long id,
            String gameType,
            String difficulty,
            double wpm,
            double accuracy,
            int correctCharacters,
            int incorrectCharacters,
            int durationSeconds,
            int score,
            LocalDateTime playedAt
    ) {
        this.id = id;
        this.gameType = gameType;
        this.difficulty = difficulty;
        this.wpm = wpm;
        this.accuracy = accuracy;
        this.correctCharacters = correctCharacters;
        this.incorrectCharacters = incorrectCharacters;
        this.durationSeconds = durationSeconds;
        this.score = score;
        this.playedAt = playedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getGameType() {
        return gameType;
    }

    public void setGameType(String gameType) {
        this.gameType = gameType;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
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

    public int getCorrectCharacters() {
        return correctCharacters;
    }

    public void setCorrectCharacters(int correctCharacters) {
        this.correctCharacters = correctCharacters;
    }

    public int getIncorrectCharacters() {
        return incorrectCharacters;
    }

    public void setIncorrectCharacters(int incorrectCharacters) {
        this.incorrectCharacters = incorrectCharacters;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(int durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public LocalDateTime getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(LocalDateTime playedAt) {
        this.playedAt = playedAt;
    }
}


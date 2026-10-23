package com.typequest.dto;

import com.typequest.model.GameType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

public class GameResultRequest {

    @NotNull(message = "WPM is required")
    @Min(value = 0, message = "WPM cannot be negative")
    @Max(value = 300, message = "WPM cannot exceed 300")
    private Integer wpm;

    @NotNull(message = "Accuracy is required")
    @Min(value = 0, message = "Accuracy must be at least 0")
    @Max(value = 100, message = "Accuracy cannot exceed 100")
    private Double accuracy;

    @NotNull(message = "Correct characters are required")
    @Min(value = 0, message = "Correct characters cannot be negative")
    private Integer correctCharacters;

    @NotNull(message = "Incorrect characters are required")
    @Min(value = 0, message = "Incorrect characters cannot be negative")
    private Integer incorrectCharacters;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 second")
    private Integer durationSeconds;

    @NotNull(message = "Game type is required")
    private GameType gameType;

    @NotNull(message = "Difficulty is required")
    private String difficulty;

    public Integer getWpm() {
        return wpm;
    }

    public void setWpm(Integer wpm) {
        this.wpm = wpm;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public Integer getCorrectCharacters() {
        return correctCharacters;
    }

    public void setCorrectCharacters(Integer correctCharacters) {
        this.correctCharacters = correctCharacters;
    }

    public Integer getIncorrectCharacters() {
        return incorrectCharacters;
    }

    public void setIncorrectCharacters(Integer incorrectCharacters) {
        this.incorrectCharacters = incorrectCharacters;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public GameType getGameType() {
        return gameType;
    }

    public void setGameType(GameType gameType) {
        this.gameType = gameType;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }
}
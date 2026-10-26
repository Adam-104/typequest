package com.typequest.dto;

import com.typequest.model.LessonProgress;

import java.time.LocalDateTime;

public class LessonProgressResponse {

    private String lessonId;
    private boolean completed;
    private double bestWpm;
    private double accuracy;
    private LocalDateTime completedAt;
    private LocalDateTime updatedAt;

    public LessonProgressResponse() {
    }

    public LessonProgressResponse(
            String lessonId,
            boolean completed,
            double bestWpm,
            double accuracy,
            LocalDateTime completedAt,
            LocalDateTime updatedAt
    ) {
        this.lessonId = lessonId;
        this.completed = completed;
        this.bestWpm = bestWpm;
        this.accuracy = accuracy;
        this.completedAt = completedAt;
        this.updatedAt = updatedAt;
    }

    public static LessonProgressResponse from(LessonProgress progress) {
        return new LessonProgressResponse(
                progress.getLessonId(),
                progress.isCompleted(),
                progress.getBestWpm(),
                progress.getAccuracy(),
                progress.getCompletedAt(),
                progress.getUpdatedAt()
        );
    }

    public String getLessonId() {
        return lessonId;
    }

    public boolean isCompleted() {
        return completed;
    }

    public double getBestWpm() {
        return bestWpm;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
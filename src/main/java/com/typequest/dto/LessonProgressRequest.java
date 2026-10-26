package com.typequest.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class LessonProgressRequest {

    @NotBlank(message = "Lesson ID is required.")
    @Size(max = 20, message = "Lesson ID cannot exceed 20 characters.")
    @Pattern(
            regexp = "[A-Za-z0-9_-]+",
            message = "Lesson ID contains invalid characters."
    )
    private String lessonId;

    @DecimalMin(value = "0.0", message = "WPM cannot be negative.")
    @DecimalMax(value = "1000.0", message = "WPM cannot exceed 1000.")
    private double wpm;

    @DecimalMin(value = "0.0", message = "Accuracy cannot be negative.")
    @DecimalMax(value = "100.0", message = "Accuracy cannot exceed 100.")
    private double accuracy;

    private boolean completed;

    public LessonProgressRequest() {
    }

    public String getLessonId() {
        return lessonId;
    }

    public void setLessonId(String lessonId) {
        this.lessonId = lessonId;
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

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}

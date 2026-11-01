package com.typequest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class CurriculumDtos {

    private CurriculumDtos() {
    }

    public record LessonDto(
            String id,
            String title,
            String duration,
            String description,
            String heading,
            String instruction,
            String tip,
            String target,
            List<String> words
    ) {
    }

    public record LevelDto(
            int id,
            String title,
            String subtitle,
            String description,
            String icon,
            String color,
            List<LessonDto> lessons
    ) {
    }

    public record LessonInput(
            @NotBlank(message = "Title is required.")
            @Size(max = 100, message = "Title can be at most 100 characters.")
            String title,

            @NotBlank(message = "Duration is required.")
            @Size(max = 20, message = "Duration can be at most 20 characters.")
            String duration,

            @NotBlank(message = "Description is required.")
            @Size(max = 500, message = "Description can be at most 500 characters.")
            String description,

            @NotBlank(message = "Heading is required.")
            @Size(max = 150, message = "Heading can be at most 150 characters.")
            String heading,

            @NotBlank(message = "Instruction is required.")
            @Size(max = 500, message = "Instruction can be at most 500 characters.")
            String instruction,

            @NotBlank(message = "Tip is required.")
            @Size(max = 500, message = "Tip can be at most 500 characters.")
            String tip,

            @NotBlank(message = "Sample text is required.")
            @Size(max = 1000, message = "Sample text can be at most 1000 characters.")
            String target,

            @NotEmpty(message = "Add at least one practice word or phrase.")
            @Size(max = 80, message = "Use at most 80 practice words or phrases.")
            List<@NotBlank(message = "Practice words cannot be empty.")
                    @Size(max = 100, message = "Each practice word can be at most 100 characters.") String> words
    ) {
    }
}

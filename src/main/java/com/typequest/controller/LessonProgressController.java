package com.typequest.controller;

import com.typequest.dto.LessonProgressRequest;
import com.typequest.dto.LessonProgressResponse;
import com.typequest.service.LessonProgressService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/lesson-progress")
public class LessonProgressController {

    private final LessonProgressService lessonProgressService;

    public LessonProgressController(
            LessonProgressService lessonProgressService
    ) {
        this.lessonProgressService = lessonProgressService;
    }

    @GetMapping
    public List<LessonProgressResponse> getAllProgress(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return lessonProgressService.getAllProgress(jwt);
    }

    @GetMapping("/completed-count")
    public long getCompletedLessonCount(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return lessonProgressService.getCompletedLessonCount(jwt);
    }

    @GetMapping("/{lessonId}")
    public LessonProgressResponse getLessonProgress(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String lessonId
    ) {
        return lessonProgressService.getLessonProgress(jwt, lessonId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public LessonProgressResponse saveProgress(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody LessonProgressRequest request
    ) {
        return lessonProgressService.saveProgress(
                jwt,
                request.getLessonId(),
                request.getWpm(),
                request.getAccuracy(),
                request.isCompleted()
        );
    }
}
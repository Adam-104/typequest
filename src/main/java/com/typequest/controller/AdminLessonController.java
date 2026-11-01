package com.typequest.controller;

import com.typequest.dto.CurriculumDtos.LessonDto;
import com.typequest.dto.CurriculumDtos.LessonInput;
import com.typequest.service.CurriculumService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Admin editing of lesson text. Lessons cannot be added or removed here.
@RestController
@RequestMapping("/api/admin/lessons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLessonController {

    private final CurriculumService curriculumService;

    public AdminLessonController(CurriculumService curriculumService) {
        this.curriculumService = curriculumService;
    }

    @PutMapping("/{id}")
    public LessonDto update(@PathVariable String id, @Valid @RequestBody LessonInput input) {
        return curriculumService.updateLesson(id, input);
    }
}

package com.typequest.controller;

import com.typequest.dto.CurriculumDtos.LevelDto;
import com.typequest.service.CurriculumService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// The course for everyone, including visitors who have not signed in.
@RestController
@RequestMapping("/api/lessons")
public class CurriculumController {

    private final CurriculumService curriculumService;

    public CurriculumController(CurriculumService curriculumService) {
        this.curriculumService = curriculumService;
    }

    @GetMapping
    public List<LevelDto> curriculum() {
        return curriculumService.curriculum();
    }
}

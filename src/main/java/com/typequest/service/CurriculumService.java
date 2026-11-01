package com.typequest.service;

import com.typequest.dto.CurriculumDtos.LessonDto;
import com.typequest.dto.CurriculumDtos.LessonInput;
import com.typequest.dto.CurriculumDtos.LevelDto;
import com.typequest.model.Lesson;
import com.typequest.repository.LessonLevelRepository;
import com.typequest.repository.LessonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// The course: levels and lessons stored in the database. Admins can edit a
// lesson's text, but cannot add or remove lessons, because saved progress
// points at lesson ids.
@Service
public class CurriculumService {

    private final LessonLevelRepository levelRepository;
    private final LessonRepository lessonRepository;

    public CurriculumService(LessonLevelRepository levelRepository, LessonRepository lessonRepository) {
        this.levelRepository = levelRepository;
        this.lessonRepository = lessonRepository;
    }

    @Transactional(readOnly = true)
    public List<LevelDto> curriculum() {
        Map<Integer, List<LessonDto>> byLevel = new LinkedHashMap<>();

        for (Lesson lesson : lessonRepository.findAllByOrderBySortOrderAsc()) {
            byLevel.computeIfAbsent(lesson.getLevelId(), key -> new ArrayList<>()).add(toDto(lesson));
        }

        return levelRepository.findAllByOrderBySortOrderAsc().stream()
                .map(level -> new LevelDto(
                        level.getId(),
                        level.getTitle(),
                        level.getSubtitle(),
                        level.getDescription(),
                        level.getIcon(),
                        level.getColor(),
                        byLevel.getOrDefault(level.getId(), List.of())
                ))
                .toList();
    }

    @Transactional
    public LessonDto updateLesson(String id, LessonInput input) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found."));

        List<String> words = input.words().stream()
                .map(CurriculumService::clean)
                .filter(word -> !word.isEmpty())
                .toList();

        if (words.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one practice word or phrase.");
        }

        String joined = String.join("\n", words);

        if (joined.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The practice words are too long in total.");
        }

        lesson.setTitle(clean(input.title()));
        lesson.setDuration(clean(input.duration()));
        lesson.setDescription(clean(input.description()));
        lesson.setHeading(clean(input.heading()));
        lesson.setInstruction(clean(input.instruction()));
        lesson.setTip(clean(input.tip()));
        lesson.setTarget(clean(input.target()));
        lesson.setWords(joined);

        return toDto(lessonRepository.save(lesson));
    }

    private static LessonDto toDto(Lesson lesson) {
        return new LessonDto(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getDuration(),
                lesson.getDescription(),
                lesson.getHeading(),
                lesson.getInstruction(),
                lesson.getTip(),
                lesson.getTarget(),
                lesson.wordList()
        );
    }

    private static String clean(String text) {
        return text.trim().replaceAll("\\s+", " ");
    }
}

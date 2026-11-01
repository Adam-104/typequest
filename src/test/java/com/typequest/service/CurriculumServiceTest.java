package com.typequest.service;

import com.typequest.dto.CurriculumDtos.LessonDto;
import com.typequest.dto.CurriculumDtos.LessonInput;
import com.typequest.dto.CurriculumDtos.LevelDto;
import com.typequest.model.Lesson;
import com.typequest.model.LessonLevel;
import com.typequest.repository.LessonLevelRepository;
import com.typequest.repository.LessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CurriculumServiceTest {

    private LessonLevelRepository levelRepository;
    private LessonRepository lessonRepository;
    private CurriculumService service;

    @BeforeEach
    void setUp() {
        levelRepository = mock(LessonLevelRepository.class);
        lessonRepository = mock(LessonRepository.class);
        service = new CurriculumService(levelRepository, lessonRepository);
    }

    private LessonLevel level(int id, String title) {
        LessonLevel level = new LessonLevel();

        ReflectionTestUtils.setField(level, "id", id);
        ReflectionTestUtils.setField(level, "title", title);
        ReflectionTestUtils.setField(level, "subtitle", "sub");
        ReflectionTestUtils.setField(level, "description", "desc");
        ReflectionTestUtils.setField(level, "icon", "i");
        ReflectionTestUtils.setField(level, "color", "purple");

        return level;
    }

    private Lesson lesson(String id, int levelId, String words) {
        Lesson lesson = new Lesson();

        ReflectionTestUtils.setField(lesson, "id", id);
        ReflectionTestUtils.setField(lesson, "levelId", levelId);
        lesson.setTitle("Title " + id);
        lesson.setDuration("4 min");
        lesson.setDescription("d");
        lesson.setHeading("h");
        lesson.setInstruction("i");
        lesson.setTip("t");
        lesson.setTarget("asdf");
        lesson.setWords(words);

        return lesson;
    }

    private LessonInput input(List<String> words) {
        return new LessonInput("  New   title ", "5 min", "desc", "head", "instr", "tip", "sample text", words);
    }

    @Test
    void groupsLessonsUnderTheirLevelsInOrder() {
        when(levelRepository.findAllByOrderBySortOrderAsc())
                .thenReturn(List.of(level(1, "One"), level(2, "Two"), level(3, "Empty")));
        when(lessonRepository.findAllByOrderBySortOrderAsc())
                .thenReturn(List.of(lesson("1-1", 1, "a\nb"), lesson("1-2", 1, "c"), lesson("2-1", 2, "d")));

        List<LevelDto> result = service.curriculum();

        assertEquals(3, result.size());
        assertEquals(List.of("1-1", "1-2"), result.get(0).lessons().stream().map(LessonDto::id).toList());
        assertEquals(List.of("2-1"), result.get(1).lessons().stream().map(LessonDto::id).toList());
        assertTrue(result.get(2).lessons().isEmpty());
        assertEquals(List.of("a", "b"), result.get(0).lessons().get(0).words());
    }

    @Test
    void updateCleansTextAndStoresWordsOnePerLine() {
        Lesson existing = lesson("1-1", 1, "old");

        when(lessonRepository.findById("1-1")).thenReturn(Optional.of(existing));
        when(lessonRepository.save(any(Lesson.class))).thenAnswer(call -> call.getArgument(0));

        LessonDto result = service.updateLesson("1-1", input(List.of(" fj ", "dk  sl", "  ")));

        assertEquals("New title", result.title());
        assertEquals(List.of("fj", "dk sl"), result.words());
        assertEquals("fj\ndk sl", existing.getWords());
    }

    @Test
    void updateKeepsTheIdAndLevel() {
        Lesson existing = lesson("3-2", 3, "old");

        when(lessonRepository.findById("3-2")).thenReturn(Optional.of(existing));
        when(lessonRepository.save(any(Lesson.class))).thenAnswer(call -> call.getArgument(0));

        service.updateLesson("3-2", input(List.of("ok")));

        assertEquals("3-2", existing.getId());
        assertEquals(3, existing.getLevelId());
    }

    @Test
    void updateRejectsAnUnknownLesson() {
        when(lessonRepository.findById("9-9")).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.updateLesson("9-9", input(List.of("ok")))
        );

        assertEquals(404, error.getStatusCode().value());
        verify(lessonRepository, never()).save(any());
    }

    @Test
    void updateRejectsWordsThatAreAllBlank() {
        when(lessonRepository.findById("1-1")).thenReturn(Optional.of(lesson("1-1", 1, "old")));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.updateLesson("1-1", input(List.of("  ", "\t")))
        );

        assertEquals(400, error.getStatusCode().value());
        verify(lessonRepository, never()).save(any());
    }

    @Test
    void updateRejectsWordsThatAreTooLongInTotal() {
        when(lessonRepository.findById("1-1")).thenReturn(Optional.of(lesson("1-1", 1, "old")));

        List<String> words = java.util.Collections.nCopies(80, "x".repeat(60));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.updateLesson("1-1", input(words))
        );

        assertEquals(400, error.getStatusCode().value());
    }
}

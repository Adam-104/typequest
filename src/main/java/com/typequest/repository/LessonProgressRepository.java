package com.typequest.repository;

import com.typequest.model.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    List<LessonProgress> findAllByUser_IdOrderByLessonIdAsc(Long userId);

    Optional<LessonProgress> findByUser_IdAndLessonId(Long userId, String lessonId);

    long countByUser_IdAndCompletedTrue(Long userId);

    long countByCompletedTrue();

    // Account deletion
    void deleteAllByUser_Id(Long userId);
}

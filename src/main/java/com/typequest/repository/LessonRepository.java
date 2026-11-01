package com.typequest.repository;

import com.typequest.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, String> {

    List<Lesson> findAllByOrderBySortOrderAsc();
}

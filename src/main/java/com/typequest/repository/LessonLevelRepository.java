package com.typequest.repository;

import com.typequest.model.LessonLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonLevelRepository extends JpaRepository<LessonLevel, Integer> {

    List<LessonLevel> findAllByOrderBySortOrderAsc();
}

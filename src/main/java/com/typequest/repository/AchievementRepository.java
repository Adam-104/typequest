package com.typequest.repository;

import com.typequest.model.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AchievementRepository
        extends JpaRepository<Achievement, Long> {

    Optional<Achievement> findByCode(String code);

    boolean existsByCode(String code);
}


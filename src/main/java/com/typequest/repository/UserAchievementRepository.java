package com.typequest.repository;

import com.typequest.model.UserAchievement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAchievementRepository
        extends JpaRepository<UserAchievement, Long> {

    boolean existsByUser_IdAndAchievement_Code(
            Long userId,
            String achievementCode
    );

    @EntityGraph(attributePaths = {"achievement"})
    List<UserAchievement> findAllByUser_IdOrderByUnlockedAtDesc(
            Long userId
    );

    long countByUser_Id(Long userId);

    // Account deletion
    void deleteAllByUser_Id(Long userId);
}

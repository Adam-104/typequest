package com.typequest.service;

import com.typequest.model.Achievement;
import com.typequest.model.User;
import com.typequest.model.UserAchievement;
import com.typequest.repository.AchievementRepository;
import com.typequest.repository.UserAchievementRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final XpService xpService;

    public AchievementService(
            AchievementRepository achievementRepository,
            UserAchievementRepository userAchievementRepository,
            XpService xpService
    ) {
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.xpService = xpService;
    }

    /**
     * Insert achievement definitions if they do not already exist.
     */
    @Transactional
    public void initializeAchievements() {

        createAchievement(
                "FIRST_STEPS",
                "First Steps",
                "Complete your first game",
                "🥉",
                50
        );

        createAchievement(
                "SHARP_SHOOTER",
                "Sharp Shooter",
                "Achieve at least 95% accuracy",
                "🎯",
                25
        );

        createAchievement(
                "SPEED_DEMON",
                "Speed Demon",
                "Reach 60 WPM",
                "⚡",
                30
        );

        createAchievement(
                "DEDICATED_PLAYER",
                "Dedicated Player",
                "Complete 10 games",
                "🔥",
                50
        );

        createAchievement(
                "RISING_STAR",
                "Rising Star",
                "Reach Level 5",
                "🏆",
                100
        );
    }

    private void createAchievement(
            String code,
            String name,
            String description,
            String icon,
            int xpReward
    ) {
        if (!achievementRepository.existsByCode(code)) {
            Achievement achievement = new Achievement(
                    code,
                    name,
                    description,
                    icon,
                    xpReward
            );

            achievementRepository.save(achievement);
        }
    }

    /**
     * Check achievement requirements after a game is completed.
     * Returns the newly unlocked achievements.
     */
    @Transactional
    public List<Achievement> checkAchievements(
            User user,
            double wpm,
            double accuracy,
            long totalGames
    ) {

        List<Achievement> unlocked = new java.util.ArrayList<>();

        if (totalGames >= 1) {
            unlockIfEligible(user, "FIRST_STEPS", unlocked);
        }

        if (accuracy >= 95) {
            unlockIfEligible(user, "SHARP_SHOOTER", unlocked);
        }

        if (wpm >= 60) {
            unlockIfEligible(user, "SPEED_DEMON", unlocked);
        }

        if (totalGames >= 10) {
            unlockIfEligible(user, "DEDICATED_PLAYER", unlocked);
        }

        if (user.getLevel() >= 5) {
            unlockIfEligible(user, "RISING_STAR", unlocked);
        }

        return unlocked;
    }

    private void unlockIfEligible(
            User user,
            String achievementCode,
            List<Achievement> unlocked
    ) {

        // Do not award an achievement twice to the same user.
        if (userAchievementRepository
                .existsByUser_IdAndAchievement_Code(
                        user.getId(),
                        achievementCode
                )) {
            return;
        }

        Achievement achievement = achievementRepository
                .findByCode(achievementCode)
                .orElseThrow(() -> new IllegalStateException(
                        "Achievement not found: " + achievementCode
                ));

        UserAchievement userAchievement =
                new UserAchievement(user, achievement);

        userAchievementRepository.save(userAchievement);

        // Award the achievement's XP bonus.
        xpService.awardXp(user, achievement.getXpReward());

        unlocked.add(achievement);
    }

    /**
     * Retrieve all achievements available in TypeQuest.
     */
    @Transactional(readOnly = true)
    public List<Achievement> getAllAchievements() {
        return achievementRepository.findAll();
    }
}

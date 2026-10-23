package com.typequest.controller;

import com.typequest.dto.MyAchievementResponse;
import com.typequest.model.Achievement;
import com.typequest.model.UserAchievement;
import com.typequest.repository.UserAchievementRepository;
import com.typequest.service.AchievementService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    private final AchievementService achievementService;
    private final UserAchievementRepository userAchievementRepository;

    public AchievementController(
            AchievementService achievementService,
            UserAchievementRepository userAchievementRepository
    ) {
        this.achievementService = achievementService;
        this.userAchievementRepository = userAchievementRepository;
    }

    // Get all available achievements
    @GetMapping
    public List<Achievement> getAllAchievements() {
        return achievementService.getAllAchievements();
    }

    // Get achievements unlocked by the logged-in user
    @GetMapping("/my-achievements")
    public List<MyAchievementResponse> getMyAchievements(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());

        List<UserAchievement> userAchievements =
                userAchievementRepository
                        .findAllByUser_IdOrderByUnlockedAtDesc(userId);

        return userAchievements.stream()
                .map(userAchievement -> {
                    Achievement achievement =
                            userAchievement.getAchievement();

                    return new MyAchievementResponse(
                            achievement.getCode(),
                            achievement.getName(),
                            achievement.getDescription(),
                            achievement.getIcon(),
                            achievement.getXpReward(),
                            userAchievement.getUnlockedAt()
                    );
                })
                .toList();
    }
}
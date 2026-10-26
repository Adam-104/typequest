package com.typequest.controller;

import com.typequest.dto.UserProfileResponse;
import com.typequest.model.User;
import com.typequest.repository.GameRepository;
import com.typequest.repository.UserAchievementRepository;
import com.typequest.repository.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final UserAchievementRepository userAchievementRepository;

    public UserController(
            UserRepository userRepository,
            GameRepository gameRepository,
            UserAchievementRepository userAchievementRepository
    ) {
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.userAchievementRepository = userAchievementRepository;
    }

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        long gamesPlayed = gameRepository.countByUser_Id(userId);

        long achievementsUnlocked =
                userAchievementRepository.countByUser_Id(userId);

        return new UserProfileResponse(
                user.getUsername(),
                user.getEmail(),
                user.getTotalXp(),
                user.getLevel(),
                gamesPlayed,
                achievementsUnlocked,
                user.getCreatedAt(),
                user.isEmailVerified()
        );
    }
}
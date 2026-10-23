package com.typequest.service;

import com.typequest.dto.GameHistoryResponse;
import com.typequest.dto.GameResultRequest;
import com.typequest.dto.GameResultResponse;
import com.typequest.dto.UnlockedAchievementResponse;
import com.typequest.model.Achievement;
import com.typequest.model.GameResult;
import com.typequest.model.User;
import com.typequest.repository.GameRepository;
import com.typequest.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final XpService xpService;
    private final AchievementService achievementService;

    public GameService(
            GameRepository gameRepository,
            UserRepository userRepository, XpService xpService, AchievementService achievementService
    ) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.xpService = xpService;
        this.achievementService = achievementService;
    }

    /**
     * Calculate and save a game result for the specified user.
     *
     * @param request the game statistics submitted by the client
     * @return the calculated game result response
     */
    @Transactional
    public GameResultResponse calculateResult(
            GameResultRequest request,
            Long userId
    ) {

        // Find the authenticated user.
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new EntityNotFoundException("User not found"));

        // Remember the previous level.
        int previousLevel = user.getLevel();

        // Calculate the game score.
        int score = (int) Math.round(
                request.getWpm() * request.getAccuracy() / 10.0
        );

        // Create the game result.
        GameResult gameResult = new GameResult();

        gameResult.setWpm(request.getWpm());
        gameResult.setAccuracy(request.getAccuracy());
        gameResult.setCorrectCharacters(request.getCorrectCharacters());
        gameResult.setIncorrectCharacters(request.getIncorrectCharacters());
        gameResult.setDurationSeconds(request.getDurationSeconds());
        gameResult.setScore(score);
        gameResult.setGameType(request.getGameType());
        gameResult.setDifficulty(request.getDifficulty());
        gameResult.setUser(user);
        gameResult.setPlayedAt(LocalDateTime.now());

        // Calculate and award game XP.
        int gameXp = xpService.calculateXp(
                request.getWpm(),
                request.getAccuracy(),
                request.getDifficulty()
        );

        xpService.awardXp(user, gameXp);

        // Save the game before counting completed games.
        gameRepository.save(gameResult);

        // Count games, including the one just completed.
        long totalGames = gameRepository.countByUser_Id(userId);

        // Check and award eligible achievements.
        List<Achievement> unlockedAchievements =
                achievementService.checkAchievements(
                        user,
                        request.getWpm(),
                        request.getAccuracy(),
                        totalGames
                );

        // Calculate total XP earned from the game and achievements.
        int achievementXp = unlockedAchievements.stream()
                .mapToInt(Achievement::getXpReward)
                .sum();

        int totalEarnedXp = Math.addExact(gameXp, achievementXp);

        List<UnlockedAchievementResponse> achievementResponses =
                unlockedAchievements.stream()
                        .map(achievement -> new UnlockedAchievementResponse(
                                achievement.getCode(),
                                achievement.getName(),
                                achievement.getDescription(),
                                achievement.getIcon(),
                                achievement.getXpReward()
                        ))
                        .toList();

        // Return the updated progression.
        GameResultResponse response = new GameResultResponse(
                "Game result saved successfully",
                gameResult.getWpm(),
                gameResult.getAccuracy(),
                gameResult.getScore(),
                totalEarnedXp,
                user.getTotalXp(),
                user.getLevel(),
                user.getLevel() > previousLevel
        );

        response.setUnlockedAchievements(achievementResponses);

        return response;
    }


    @Transactional(readOnly = true)
    public List<GameHistoryResponse> getGameHistory(Long userId) {

        return gameRepository
                .findAllByUser_IdOrderByPlayedAtDesc(userId)
                .stream()
                .map(game -> new GameHistoryResponse(
                        game.getId(),
                        game.getGameType().name(),
                        game.getDifficulty(),
                        game.getWpm(),
                        game.getAccuracy(),
                        game.getCorrectCharacters(),
                        game.getIncorrectCharacters(),
                        game.getDurationSeconds(),
                        game.getScore(),
                        game.getPlayedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<GameHistoryResponse> getGameResultById(
            Long id,
            Long userId
    ) {

        return gameRepository.findByIdAndUser_Id(id, userId)
                .map(game -> new GameHistoryResponse(
                        game.getId(),
                        game.getGameType().name(),
                        game.getDifficulty(),
                        game.getWpm(),
                        game.getAccuracy(),
                        game.getCorrectCharacters(),
                        game.getIncorrectCharacters(),
                        game.getDurationSeconds(),
                        game.getScore(),
                        game.getPlayedAt()
                ));
    }
}


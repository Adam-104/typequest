package com.typequest.service;

import com.typequest.dto.AdminDtos.*;
import com.typequest.model.Achievement;
import com.typequest.model.GameResult;
import com.typequest.model.Passage;
import com.typequest.model.Role;
import com.typequest.model.User;
import com.typequest.repository.AchievementRepository;
import com.typequest.repository.GameRepository;
import com.typequest.repository.LessonProgressRepository;
import com.typequest.repository.PassageRepository;
import com.typequest.repository.RefreshTokenRepository;
import com.typequest.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final AchievementRepository achievementRepository;
    private final PassageRepository passageRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public AdminService(
            UserRepository userRepository,
            GameRepository gameRepository,
            LessonProgressRepository lessonProgressRepository,
            AchievementRepository achievementRepository,
            PassageRepository passageRepository,
            RefreshTokenRepository refreshTokenRepository
    ) {
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.achievementRepository = achievementRepository;
        this.passageRepository = passageRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    // ---- Stats ---------------------------------------------------------

    @Transactional(readOnly = true)
    public Stats stats() {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);

        Map<String, Long> byType = new LinkedHashMap<>();

        for (Object[] row : gameRepository.countGroupedByGameType()) {
            byType.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }

        List<RecentGame> recent = gameRepository
                .findAllByOrderByPlayedAtDesc(PageRequest.of(0, 8))
                .stream()
                .map(game -> new RecentGame(
                        game.getId(),
                        usernameOf(game),
                        String.valueOf(game.getGameType()),
                        game.getWpm(),
                        game.getAccuracy(),
                        game.getPlayedAt()
                ))
                .toList();

        return new Stats(
                userRepository.count(),
                userRepository.countByCreatedAtAfter(weekAgo),
                userRepository.countByDisabledTrue(),
                gameRepository.count(),
                gameRepository.countByPlayedAtAfter(weekAgo),
                round(gameRepository.averageWpm()),
                round(gameRepository.averageAccuracy()),
                lessonProgressRepository.countByCompletedTrue(),
                byType,
                recent
        );
    }

    // ---- Users ---------------------------------------------------------

    @Transactional(readOnly = true)
    public PageOf<UserRow> users(String query, int page, int size) {
        PageRequest request = PageRequest.of(
                Math.max(0, page),
                clampSize(size),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        String q = query == null ? "" : query.trim();

        var result = q.isEmpty()
                ? userRepository.findAll(request)
                : userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, request);

        return new PageOf<>(
                result.getContent().stream().map(this::toRow).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements()
        );
    }

    @Transactional
    public UserRow updateUser(Long adminId, Long userId, UserUpdate update) {
        User user = findUser(userId);
        boolean self = user.getId().equals(adminId);

        if (self && (Boolean.TRUE.equals(update.disabled())
                || (update.role() != null && !Role.ROLE_ADMIN.name().equals(update.role())))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot disable or demote your own account."
            );
        }

        if (update.disabled() != null) {
            user.setDisabled(update.disabled());

            // Disabled accounts cannot renew their session.
            if (update.disabled()) {
                refreshTokenRepository.revokeAllForUser(user.getId());
            }
        }

        if (update.leaderboardBanned() != null) {
            user.setLeaderboardBanned(update.leaderboardBanned());
        }

        if (update.role() != null) {
            user.setRole(Role.valueOf(update.role()));
        }

        return toRow(userRepository.save(user));
    }

    @Transactional
    public UserRow unlockUser(Long userId) {
        User user = findUser(userId);

        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);

        return toRow(userRepository.save(user));
    }

    @Transactional
    public UserRow resetXp(Long userId) {
        User user = findUser(userId);

        user.setTotalXp(0);
        user.setLevel(1);

        return toRow(userRepository.save(user));
    }

    // ---- Games ---------------------------------------------------------

    @Transactional(readOnly = true)
    public PageOf<GameRow> games(int page, int size) {
        var result = gameRepository.findAllByOrderByPlayedAtDesc(
                PageRequest.of(Math.max(0, page), clampSize(size))
        );

        return new PageOf<>(
                result.getContent().stream().map(this::toRow).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements()
        );
    }

    @Transactional
    public void deleteGame(Long gameId) {
        if (!gameRepository.existsById(gameId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game result not found.");
        }

        gameRepository.deleteById(gameId);
    }

    // ---- Achievements --------------------------------------------------

    @Transactional
    public Achievement updateAchievement(Long id, AchievementUpdate update) {
        Achievement achievement = achievementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Achievement not found."));

        int xp = update.xpReward() == null ? achievement.getXpReward() : update.xpReward();

        if (xp < 0 || xp > 10_000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "XP reward must be between 0 and 10000.");
        }

        achievement.setName(update.name().trim());
        achievement.setDescription(update.description() == null ? null : update.description().trim());
        achievement.setIcon(update.icon() == null ? null : update.icon().trim());
        achievement.setXpReward(xp);

        return achievementRepository.save(achievement);
    }

    // ---- Passages ------------------------------------------------------

    @Transactional(readOnly = true)
    public List<PassageRow> passages() {
        return passageRepository.findAllByOrderByIdDesc().stream().map(this::toRow).toList();
    }

    @Transactional
    public PassageRow createPassage(PassageInput input) {
        Passage passage = new Passage();

        passage.setCategory(input.category());
        passage.setText(clean(input.text()));
        passage.setActive(input.active() == null || input.active());

        return toRow(passageRepository.save(passage));
    }

    @Transactional
    public PassageRow updatePassage(Long id, PassageInput input) {
        Passage passage = passageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Passage not found."));

        passage.setCategory(input.category());
        passage.setText(clean(input.text()));

        if (input.active() != null) {
            passage.setActive(input.active());
        }

        return toRow(passageRepository.save(passage));
    }

    @Transactional
    public void deletePassage(Long id) {
        if (!passageRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Passage not found.");
        }

        passageRepository.deleteById(id);
    }

    @Transactional
    public ImportResult importPassages(List<PassageInput> inputs) {
        int added = 0;
        int skipped = 0;

        if (inputs == null) {
            return new ImportResult(0, 0);
        }

        for (PassageInput input : inputs) {
            String text = clean(input.text());

            if (passageRepository.existsByCategoryAndText(input.category(), text)) {
                skipped++;
                continue;
            }

            Passage passage = new Passage();

            passage.setCategory(input.category());
            passage.setText(text);
            passage.setActive(true);
            passageRepository.save(passage);
            added++;
        }

        return new ImportResult(added, skipped);
    }

    // Texts the games use: only the active ones of one category.
    @Transactional(readOnly = true)
    public List<String> activePassageTexts(String category) {
        return passageRepository.findByCategoryAndActiveTrueOrderByIdAsc(category)
                .stream()
                .map(Passage::getText)
                .toList();
    }

    // ---- Helpers -------------------------------------------------------

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found."));
    }

    private UserRow toRow(User user) {
        LocalDateTime lockedUntil = user.getLockedUntil();

        return new UserRow(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getLevel(),
                user.getTotalXp(),
                user.getCreatedAt(),
                user.isDisabled(),
                user.isLeaderboardBanned(),
                lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now())
        );
    }

    private GameRow toRow(GameResult game) {
        User user = game.getUser();

        return new GameRow(
                game.getId(),
                user == null ? null : user.getId(),
                usernameOf(game),
                String.valueOf(game.getGameType()),
                game.getDifficulty(),
                game.getWpm(),
                game.getAccuracy(),
                game.getDurationSeconds(),
                game.getScore(),
                game.getPlayedAt()
        );
    }

    private PassageRow toRow(Passage passage) {
        return new PassageRow(
                passage.getId(),
                passage.getCategory(),
                passage.getText(),
                passage.isActive(),
                passage.getCreatedAt()
        );
    }

    private static String usernameOf(GameResult game) {
        return game.getUser() == null ? "(deleted user)" : game.getUser().getUsername();
    }

    private static String clean(String text) {
        return text.trim().replaceAll("\\s+", " ");
    }

    private static double round(Double value) {
        return value == null ? 0 : Math.round(value * 10.0) / 10.0;
    }

    private static int clampSize(int size) {
        return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
    }
}

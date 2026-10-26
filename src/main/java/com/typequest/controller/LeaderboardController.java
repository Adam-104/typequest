package com.typequest.controller;

import com.typequest.dto.LeaderboardResponse;
import com.typequest.model.User;
import com.typequest.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final UserRepository userRepository;

    public LeaderboardController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Top 100 players by XP. The caller's own row is flagged so the UI can
     * highlight it.
     */
    @GetMapping
    public List<LeaderboardResponse> getLeaderboard(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long currentUserId = Long.valueOf(jwt.getSubject());

        List<User> users = userRepository.findTop100ByLeaderboardBannedFalseOrderByTotalXpDescIdAsc();

        List<LeaderboardResponse> leaderboard = new ArrayList<>();

        int rank = 1;

        for (User user : users) {
            leaderboard.add(
                    new LeaderboardResponse(
                            rank++,
                            user.getUsername(),
                            user.getTotalXp(),
                            user.getLevel(),
                            user.getId().equals(currentUserId)
                    )
            );
        }

        return leaderboard;
    }

    /**
     * The caller's rank, even when they are outside the top 100.
     */
    @GetMapping("/me")
    public ResponseEntity<LeaderboardResponse> getMyRank(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());

        return userRepository.findById(userId)
                .filter(user -> !user.isLeaderboardBanned())
                .map(user -> ResponseEntity.ok(
                        new LeaderboardResponse(
                                (int) userRepository.countByTotalXpGreaterThanAndLeaderboardBannedFalse(
                                        user.getTotalXp()) + 1,
                                user.getUsername(),
                                user.getTotalXp(),
                                user.getLevel(),
                                true
                        )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

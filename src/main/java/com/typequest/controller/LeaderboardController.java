package com.typequest.controller;

import com.typequest.dto.LeaderboardResponse;
import com.typequest.model.User;
import com.typequest.repository.UserRepository;
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

    @GetMapping
    public List<LeaderboardResponse> getLeaderboard() {

        List<User> users = userRepository.findAllByOrderByTotalXpDesc();

        List<LeaderboardResponse> leaderboard = new ArrayList<>();

        int rank = 1;

        for (User user : users) {
            leaderboard.add(
                    new LeaderboardResponse(
                            rank++,
                            user.getUsername(),
                            user.getTotalXp(),
                            user.getLevel()
                    )
            );
        }

        return leaderboard;
    }
}
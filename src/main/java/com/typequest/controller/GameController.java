package com.typequest.controller;

import com.typequest.dto.GameHistoryResponse;
import com.typequest.dto.GameResultRequest;
import com.typequest.dto.GameResultResponse;
import com.typequest.model.GameResult;
import com.typequest.service.GameService;
import com.typequest.service.RateLimitService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    // The shortest game takes about 30 seconds, so more than 120 results in
    // 15 minutes cannot come from real play. Stops scripts from farming XP.
    private static final int MAX_RESULTS_PER_WINDOW = 120;

    private final GameService gameService;
    private final RateLimitService rateLimitService;

    public GameController(GameService gameService, RateLimitService rateLimitService) {
        this.gameService = gameService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/typing-challenge")
    public GameResultResponse submitResult(
            @Valid @RequestBody GameResultRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        if (!rateLimitService.isAllowed("game-submit:" + userId, MAX_RESULTS_PER_WINDOW)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "You are submitting results too quickly. Please slow down."
            );
        }

        return gameService.calculateResult(request, userId);
    }

    @GetMapping("/history")
    public ResponseEntity<List<GameHistoryResponse>> getGameHistory(
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        return ResponseEntity.ok(gameService.getGameHistory(userId));
    }

    @GetMapping("/history/{id}")
    public ResponseEntity<GameHistoryResponse> getGameResultById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        return gameService.getGameResultById(id, userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
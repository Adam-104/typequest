package com.typequest.controller;

import com.typequest.dto.GameHistoryResponse;
import com.typequest.dto.GameResultRequest;
import com.typequest.dto.GameResultResponse;
import com.typequest.model.GameResult;
import com.typequest.service.GameService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/typing-challenge")
    public GameResultResponse submitResult(
            @Valid @RequestBody GameResultRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

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
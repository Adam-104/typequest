package com.typequest.repository;

import com.typequest.model.GameResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameRepository extends JpaRepository<GameResult, Long> {

    List<GameResult> findAllByOrderByPlayedAtDesc();

    // Retrieve only the authenticated user's game history
    List<GameResult> findAllByUser_IdOrderByPlayedAtDesc(Long userId);

    // Retrieve a specific game result belonging to that user
    Optional<GameResult> findByIdAndUser_Id(Long id, Long userId);

    // Retrieve total number of games played by the user
    long countByUser_Id(Long userId);

}
package com.typequest.repository;

import com.typequest.model.GameResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
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

    // Admin area
    Page<GameResult> findAllByOrderByPlayedAtDesc(Pageable pageable);

    long countByPlayedAtAfter(LocalDateTime since);

    @Query("SELECT AVG(g.wpm) FROM GameResult g")
    Double averageWpm();

    @Query("SELECT AVG(g.accuracy) FROM GameResult g")
    Double averageAccuracy();

    @Query("SELECT g.gameType, COUNT(g) FROM GameResult g GROUP BY g.gameType")
    List<Object[]> countGroupedByGameType();

    // Account deletion
    void deleteAllByUser_Id(Long userId);
}

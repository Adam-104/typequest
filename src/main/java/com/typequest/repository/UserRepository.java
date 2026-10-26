package com.typequest.repository;

import com.typequest.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    boolean existsByEmail(String email);

    List<User> findAllByOrderByTotalXpDesc();

    List<User> findTop100ByOrderByTotalXpDescIdAsc();

    long countByTotalXpGreaterThan(int totalXp);

    boolean existsByUsername(String username);

    // Usernames are unique whatever the capitalisation (Ace and ace clash).
    boolean existsByUsernameIgnoreCase(String username);

    // Public leaderboard: players an admin has banned are left out.
    List<User> findTop100ByLeaderboardBannedFalseOrderByTotalXpDescIdAsc();

    long countByTotalXpGreaterThanAndLeaderboardBannedFalse(int totalXp);

    // Admin area
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String username, String email, Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime since);

    long countByDisabledTrue();
}
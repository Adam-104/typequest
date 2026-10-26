package com.typequest.repository;

import com.typequest.model.RefreshToken;
import com.typequest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHashForUpdate(
            @Param("tokenHash") String tokenHash
    );

    List<RefreshToken> findAllByUserAndRevokedFalse(User user);

    // Sign a user out everywhere (used when an admin disables an account).
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user.id = :userId AND rt.revoked = false")
    int revokeAllForUser(@Param("userId") Long userId);

    // Sign a user out everywhere except on the device that keeps this token.
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user.id = :userId AND rt.revoked = false AND rt.tokenHash <> :keepHash")
    int revokeAllForUserExcept(@Param("userId") Long userId, @Param("keepHash") String keepHash);

    // Delete all refresh tokens belonging to a user.
    void deleteAllByUser(User user);
}
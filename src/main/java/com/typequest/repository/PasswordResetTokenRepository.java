package com.typequest.repository;

import com.typequest.model.PasswordResetToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findAllByUser_IdAndUsedFalse(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
       SELECT t
       FROM PasswordResetToken t
       WHERE t.tokenHash = :tokenHash
       """)
    Optional<PasswordResetToken> findByTokenHashForUpdate(
            @Param("tokenHash") String tokenHash);

}

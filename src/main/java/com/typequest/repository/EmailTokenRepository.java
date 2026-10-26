package com.typequest.repository;

import com.typequest.model.EmailToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmailTokenRepository extends JpaRepository<EmailToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM EmailToken t WHERE t.tokenHash = :tokenHash")
    Optional<EmailToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    List<EmailToken> findAllByUser_IdAndPurposeAndUsedFalse(Long userId, String purpose);

    void deleteAllByUser_Id(Long userId);
}

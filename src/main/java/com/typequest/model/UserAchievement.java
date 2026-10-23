package com.typequest.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_achievements",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_achievement",
                        columnNames = {"user_id", "achievement_id"}
                )
        }
)
public class UserAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;

    @Column(nullable = false, updatable = false)
    private LocalDateTime unlockedAt;

    public UserAchievement() {
    }

    public UserAchievement(User user, Achievement achievement) {
        this.user = user;
        this.achievement = achievement;
    }

    @PrePersist
    public void beforeSave() {
        if (unlockedAt == null) {
            unlockedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Achievement getAchievement() {
        return achievement;
    }

    public void setAchievement(Achievement achievement) {
        this.achievement = achievement;
    }

    public LocalDateTime getUnlockedAt() {
        return unlockedAt;
    }
}

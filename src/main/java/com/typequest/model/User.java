package com.typequest.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_users_email",
                        columnNames = "email"
                ),
                // MySQL's default collation ignores case, so this also
                // stops "Ace" and "ace" from both existing.
                @UniqueConstraint(
                        name = "uk_users_username",
                        columnNames = "username"
                )
        }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Total experience points earned by the player
    @Column(nullable = false)
    private int totalXp = 0;

    // Current player level
    @Column(nullable = false)
    private int level = 1;

    // Role
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.ROLE_USER;

    // Set by an admin to block sign-in. Stored as "disabled" (not "enabled")
    // so the value Hibernate gives existing rows when it adds the column
    // (false) leaves every current account active.
    @Column(nullable = false)
    private boolean disabled = false;

    // Set by an admin to hide a player from the public leaderboard.
    @Column(name = "leaderboard_banned", nullable = false)
    private boolean leaderboardBanned = false;

    // True once the player has clicked the link emailed to them. Not required
    // to play; the app just reminds unverified players.
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    // Failed login attempts
    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    // locked until.?
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    public User() {
    }

    @PrePersist
    public void beforeSave() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public int getTotalXp() {
        return totalXp;
    }

    public void setTotalXp(int totalXp) {
        this.totalXp = totalXp;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public int getFailedLoginAttempts() {
        return failedLoginAttempts;
    }

    public void setFailedLoginAttempts(int failedLoginAttempts) {
        this.failedLoginAttempts = failedLoginAttempts;
    }

    public LocalDateTime getLockedUntil() {
        return lockedUntil;
    }

    public void setLockedUntil(LocalDateTime lockedUntil) {
        this.lockedUntil = lockedUntil;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public boolean isLeaderboardBanned() {
        return leaderboardBanned;
    }

    public void setLeaderboardBanned(boolean leaderboardBanned) {
        this.leaderboardBanned = leaderboardBanned;
    }

    public void setId(long l) {
        this.id = l;
    }
}


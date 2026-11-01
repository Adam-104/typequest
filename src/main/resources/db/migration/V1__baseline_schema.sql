-- TypeQuest baseline schema (Flyway V1).
--
-- This is the schema Hibernate used to create on its own. A brand-new database
-- gets it from this file. A database that already has these tables (the one
-- on Aiven, or your laptop) is marked as "at version 1" without running this
-- file (spring.flyway.baseline-on-migrate), so nothing is changed or lost.
--
-- Rules for the future: never edit this file. Add V2__what_changed.sql,
-- V3__..., and let Hibernate only validate (JPA_DDL_AUTO=validate).
--
-- No CHARSET/COLLATE is set on purpose: the database default is used. With
-- MySQL's default case-insensitive collation, uk_users_username also stops
-- "Ace" and "ace" from both existing.

CREATE TABLE users (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    username              VARCHAR(50)  NOT NULL,
    email                 VARCHAR(150) NOT NULL,
    password              VARCHAR(255) NOT NULL,
    created_at            DATETIME(6)  NOT NULL,
    total_xp              INTEGER      NOT NULL,
    level                 INTEGER      NOT NULL,
    role                  ENUM('ROLE_USER', 'ROLE_ADMIN') NOT NULL,
    disabled              BIT          NOT NULL,
    leaderboard_banned    BIT          NOT NULL,
    email_verified        BIT          NOT NULL,
    failed_login_attempts INTEGER      NOT NULL,
    locked_until          DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email    UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username)
) ENGINE = InnoDB;

CREATE TABLE achievements (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon        VARCHAR(20),
    xp_reward   INTEGER      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_achievement_code UNIQUE (code)
) ENGINE = InnoDB;

CREATE TABLE game_results (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    wpm                  INTEGER,
    accuracy             DOUBLE,
    correct_characters   INTEGER,
    incorrect_characters INTEGER,
    duration_seconds     INTEGER,
    score                INTEGER,
    played_at            DATETIME(6),
    game_type            VARCHAR(50)  NOT NULL,
    difficulty           VARCHAR(255) NOT NULL,
    user_id              BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_game_results_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE lesson_progress (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    user_id      BIGINT      NOT NULL,
    lesson_id    VARCHAR(20) NOT NULL,
    completed    BIT         NOT NULL,
    best_wpm     DOUBLE      NOT NULL,
    accuracy     DOUBLE      NOT NULL,
    completed_at DATETIME(6),
    created_at   DATETIME(6) NOT NULL,
    updated_at   DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_lesson_progress_user_lesson UNIQUE (user_id, lesson_id),
    CONSTRAINT fk_lesson_progress_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE INDEX idx_lesson_progress_user ON lesson_progress (user_id);

CREATE TABLE user_achievements (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    user_id        BIGINT      NOT NULL,
    achievement_id BIGINT      NOT NULL,
    unlocked_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_achievement UNIQUE (user_id, achievement_id),
    CONSTRAINT fk_user_achievements_user        FOREIGN KEY (user_id)        REFERENCES users (id),
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements (id)
) ENGINE = InnoDB;

CREATE TABLE refresh_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    token_hash VARCHAR(64) NOT NULL,
    user_id    BIGINT      NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked    BIT         NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE UNIQUE INDEX idx_refresh_token_hash ON refresh_tokens (token_hash);

CREATE TABLE password_reset_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    token_hash VARCHAR(64) NOT NULL,
    user_id    BIGINT      NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used       BIT         NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE UNIQUE INDEX idx_password_reset_token_hash ON password_reset_tokens (token_hash);

CREATE TABLE email_tokens (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    token_hash VARCHAR(64)  NOT NULL,
    user_id    BIGINT       NOT NULL,
    purpose    VARCHAR(10)  NOT NULL,
    new_email  VARCHAR(150),
    expires_at DATETIME(6)  NOT NULL,
    used       BIT          NOT NULL,
    created_at DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_email_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_email_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE INDEX idx_email_token_user ON email_tokens (user_id);

CREATE TABLE passages (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    category   VARCHAR(20)   NOT NULL,
    text       VARCHAR(1000) NOT NULL,
    active     BIT           NOT NULL,
    created_at DATETIME(6)   NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB;

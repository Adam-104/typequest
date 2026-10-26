package com.typequest.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// A practice text that admins manage. Typing Speed and Typing Racer use the
// active ones (and fall back to the built-in texts when there are none).
@Entity
@Table(name = "passages")
public class Passage {

    public static final String SPEED = "SPEED";
    public static final String RACE = "RACE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SPEED or RACE
    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false, length = 1000)
    private String text;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void beforeSave() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

package com.typequest.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "achievements",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_achievement_code",
                        columnNames = "code"
                )
        }
)
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 20)
    private String icon;

    @Column(nullable = false)
    private int xpReward;

    public Achievement() {
    }

    public Achievement(
            String code,
            String name,
            String description,
            String icon,
            int xpReward
    ) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.xpReward = xpReward;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public int getXpReward() {
        return xpReward;
    }

    public void setXpReward(int xpReward) {
        this.xpReward = xpReward;
    }
}

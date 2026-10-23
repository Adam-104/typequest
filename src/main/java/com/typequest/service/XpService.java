package com.typequest.service;

import com.typequest.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class XpService {

    private static final int BASE_XP = 50;

    /**
     * Calculate XP earned from a completed game.
     */
    public int calculateXp(double wpm, double accuracy, String difficulty) {

        int xp = BASE_XP;

        // Accuracy bonus
        if (accuracy >= 95) {
            xp += 20;
        } else if (accuracy >= 90) {
            xp += 10;
        }

        // Typing speed bonus
        if (wpm >= 60) {
            xp += 15;
        } else if (wpm >= 40) {
            xp += 10;
        }

        // Difficulty bonus
        if (difficulty != null) {
            switch (difficulty.toUpperCase()) {
                case "INTERMEDIATE" -> xp += 10;
                case "ADVANCED" -> xp += 20;
                default -> {
                    // BEGINNER receives no additional XP.
                }
            }
        }

        return xp;
    }

    /**
     * Add earned XP and update the user's level.
     */
    @Transactional
    public void awardXp(User user, int earnedXp) {

        if (earnedXp < 0) {
            throw new IllegalArgumentException(
                    "Earned XP cannot be negative"
            );
        }

        int updatedXp = Math.addExact(user.getTotalXp(), earnedXp);

        user.setTotalXp(updatedXp);
        user.setLevel(calculateLevel(updatedXp));
    }

    /**
     * Determine the player's level from total XP.
     *
     * Level 1:     0 XP
     * Level 2:   100 XP
     * Level 3:   300 XP
     * Level 4:   600 XP
     * Level 5: 1,000 XP
     */
    public int calculateLevel(int totalXp) {

        if (totalXp < 0) {
            throw new IllegalArgumentException(
                    "Total XP cannot be negative"
            );
        }

        int level = 1;
        int requiredXp = 100;

        while (totalXp >= requiredXp) {
            level++;
            requiredXp += level * 100;
        }

        return level;
    }
}

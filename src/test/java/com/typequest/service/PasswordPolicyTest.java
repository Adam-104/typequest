package com.typequest.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PasswordPolicyTest {

    @Test
    void twelveCharactersIsEnough() {
        assertDoesNotThrow(() -> PasswordPolicy.requireValid("abcdefghijkl"));
    }

    @Test
    void elevenCharactersIsTooShort() {
        assertThrows(IllegalArgumentException.class,
                () -> PasswordPolicy.requireValid("abcdefghijk"));
    }

    @Test
    void nullIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.requireValid(null));
    }

    @Test
    void seventyTwoBytesIsTheLimit() {
        assertDoesNotThrow(() -> PasswordPolicy.requireValid("a".repeat(72)));
        assertThrows(IllegalArgumentException.class,
                () -> PasswordPolicy.requireValid("a".repeat(73)));
    }

    @Test
    void limitCountsBytesNotCharacters() {
        // 40 characters, but 80 bytes: BCrypt would silently cut it at 72.
        assertThrows(IllegalArgumentException.class,
                () -> PasswordPolicy.requireValid("é".repeat(40)));
    }
}

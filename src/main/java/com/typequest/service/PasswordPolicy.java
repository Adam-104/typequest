package com.typequest.service;

import java.nio.charset.StandardCharsets;

// One password rule for sign-up and password reset (it used to be 8 for
// sign-up and 12 for reset).
//
// BCrypt only looks at the first 72 BYTES of a password, so the upper limit is
// counted in bytes: a longer password would silently be cut short.
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 12;
    public static final int MAX_BYTES = 72;

    public static final String MESSAGE =
            "Password must be 12–72 characters.";

    private PasswordPolicy() {
    }

    public static void requireValid(String password) {
        if (password == null
                || password.length() < MIN_LENGTH
                || password.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            throw new IllegalArgumentException(MESSAGE);
        }
    }
}

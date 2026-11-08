// One password rule for the browser, matching the server (PasswordPolicy.java):
// at least 12 characters, and at most 72 BYTES, because BCrypt only reads the
// first 72 bytes. Emoji and many non-English letters take several bytes each.
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX_BYTES = 72;

const encoder = new TextEncoder();

export function passwordBytes(password) {
    return encoder.encode(password).length;
}

// Returns an error message, or null when the password is acceptable.
export function validatePassword(password) {
    if (password.length < PASSWORD_MIN) {
        return `Your password must contain at least ${PASSWORD_MIN} characters.`;
    }

    if (passwordBytes(password) > PASSWORD_MAX_BYTES) {
        return `Your password is too long. Use at most ${PASSWORD_MAX_BYTES} bytes (about 72 letters; emoji and accented letters count for more).`;
    }

    return null;
}

const COMMON_PARTS = ['password', 'qwerty', '123456', 'letmein', 'typequest', 'abcdef', '111111'];

// Guidance only: the server enforces the length rule and nothing else.
// score 0 = empty, 1 = too short, 2 = okay, 3 = good, 4 = strong.
export function passwordStrength(password) {
    if (!password) {
        return {score: 0, label: ''};
    }

    if (password.length < PASSWORD_MIN) {
        return {score: 1, label: 'Too short'};
    }

    const lower = password.toLowerCase();
    const guessable = COMMON_PARTS.some((part) => lower.includes(part)) || new Set(password).size <= 3;

    let score = 2;

    if (password.length >= 16) score += 1;

    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;

    if (kinds >= 3) score += 1;

    if (guessable) {
        return {score: Math.min(score, 2), label: 'Easy to guess'};
    }

    return {score, label: ['', 'Too short', 'Okay', 'Good', 'Strong'][score]};
}

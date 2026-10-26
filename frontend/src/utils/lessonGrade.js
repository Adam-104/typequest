// How a lesson attempt is graded. Accuracy counts every key pressed.

export const PASS_ACCURACY = 85;

export function starsFor(accuracy) {
    if (accuracy >= 97) return 3;
    if (accuracy >= 92) return 2;
    if (accuracy >= PASS_ACCURACY) return 1;

    return 0;
}

// Stars for a saved lesson (the server keeps the best accuracy).
export function starsForProgress(entry) {
    return entry?.completed ? Math.max(1, starsFor(entry.accuracy)) : 0;
}

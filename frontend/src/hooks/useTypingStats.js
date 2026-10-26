import {useCallback, useRef} from 'react';

// Tracks keystrokes for the word-based arcade games so they can report
// WPM / accuracy in the same shape as the typing tests.
//
//   recordInput(value)   call on every input change
//   recordWord(length)   call when a word is cleared correctly
export default function useTypingStats() {
    const stats = useRef({startedAt: Date.now(), pausedMs: 0, pausedAt: null, typed: 0, correct: 0, prev: 0, submitted: false});

    const reset = useCallback(() => {
        stats.current = {startedAt: Date.now(), pausedMs: 0, pausedAt: null, typed: 0, correct: 0, prev: 0, submitted: false};
    }, []);

    const recordInput = useCallback((value) => {
        const current = stats.current;

        if (value.length > current.prev) {
            current.typed += value.length - current.prev;
        }

        current.prev = value.length;
    }, []);

    const recordWord = useCallback((length) => {
        stats.current.correct += length;
        stats.current.prev = 0;
    }, []);

    // Time spent paused does not count towards WPM.
    const pause = useCallback(() => {
        if (stats.current.pausedAt === null) {
            stats.current.pausedAt = Date.now();
        }
    }, []);

    const resume = useCallback(() => {
        const current = stats.current;

        if (current.pausedAt !== null) {
            current.pausedMs += Date.now() - current.pausedAt;
            current.pausedAt = null;
        }
    }, []);

    // Returns true only once per run, so a finished game is saved once.
    const claimSubmission = useCallback(() => {
        if (stats.current.submitted) {
            return false;
        }

        stats.current.submitted = true;

        return true;
    }, []);

    const snapshot = useCallback(() => {
        const {startedAt, pausedMs, pausedAt, typed, correct} = stats.current;

        const now = pausedAt ?? Date.now();
        const durationSeconds = Math.max(
            1,
            Math.round((now - startedAt - pausedMs) / 1000),
        );
        const totalTyped = Math.max(typed, correct);
        const accuracy = totalTyped
            ? Math.round((correct / totalTyped) * 100)
            : 0;
        const wpm = Math.round(correct / 5 / (durationSeconds / 60));

        return {
            wpm,
            accuracy,
            correctCharacters: correct,
            incorrectCharacters: totalTyped - correct,
            durationSeconds,
        };
    }, []);

    return {reset, recordInput, recordWord, snapshot, claimSubmission, pause, resume};
}

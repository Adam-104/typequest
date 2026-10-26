// Per-key typing statistics, kept in the browser. Practice uses them to
// find the keys you miss or hit slowly. Keys are the expected characters.

const STORAGE_KEY = 'typequest-key-stats';
const MAX_GAP_MS = 2000; // pauses longer than this are not typing speed

function read() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function write(stats) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
        // Storage unavailable: stats just are not kept.
    }
}

// entries: [{char, ok, gapMs}] from one session.
export function recordKeystrokes(entries) {
    const stats = read();

    for (const {char, ok, gapMs} of entries) {
        if (!char || char === ' ') continue;

        const key = char.toLowerCase();
        const entry = stats[key] ?? {hits: 0, misses: 0, ms: 0, timed: 0};

        if (ok) {
            entry.hits += 1;

            if (gapMs > 0 && gapMs < MAX_GAP_MS) {
                entry.ms += gapMs;
                entry.timed += 1;
            }
        } else {
            entry.misses += 1;
        }

        stats[key] = entry;
    }

    write(stats);
}

export function getKeyStats() {
    const stats = read();

    return Object.entries(stats).map(([char, entry]) => {
        const attempts = entry.hits + entry.misses;

        return {
            char,
            attempts,
            accuracy: attempts ? Math.round((entry.hits / attempts) * 100) : 100,
            avgMs: entry.timed ? Math.round(entry.ms / entry.timed) : 0,
        };
    });
}

export function totalKeystrokes() {
    return getKeyStats().reduce((sum, key) => sum + key.attempts, 0);
}

// Keys that need the most work: low accuracy first, then slowest.
export function weakestKeys(count = 6, minAttempts = 5) {
    return getKeyStats()
        .filter((key) => key.attempts >= minAttempts && /[a-z0-9;,.'/\-[\]]/.test(key.char))
        .sort((a, b) => (a.accuracy - b.accuracy) || (b.avgMs - a.avgMs))
        .slice(0, count)
        .filter((key) => key.accuracy < 100 || key.avgMs > 0);
}

export function clearKeyStats() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Nothing to clear.
    }
}

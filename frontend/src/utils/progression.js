// Level maths mirrors XpService on the backend:
// level n starts at 50 * n * (n - 1) total XP (L2 = 100, L3 = 300, ...).

export function xpForLevel(level) {
    return 50 * level * (level - 1);
}

export function levelProgress(totalXp = 0, level = 1) {
    const start = xpForLevel(level);
    const end = xpForLevel(level + 1);
    const span = Math.max(1, end - start);
    const into = Math.max(0, totalXp - start);

    return {
        start,
        end,
        percent: Math.min(100, (into / span) * 100),
        remaining: Math.max(0, end - totalXp),
    };
}

const RANKS = [
    [1, 'Rookie Typist'],
    [3, 'Keystroke Cadet'],
    [5, 'Rising Explorer'],
    [8, 'Speed Seeker'],
    [12, 'Keyboard Knight'],
    [18, 'Word Warrior'],
    [25, 'Typing Legend'],
];

export function rankTitle(level = 1) {
    let title = RANKS[0][1];

    for (const [minLevel, name] of RANKS) {
        if (level >= minLevel) title = name;
    }

    return title;
}

export const GAME_LABELS = {
    TYPING_SPEED_CHALLENGE: 'Typing Speed',
    TYPING_RACE: 'Typing Racer',
    WORD_SURVIVAL: 'Word Survival',
    SPACE_MISSION: 'Space Mission',
    NINJA_WORD_STRIKE: 'Ninja Word Strike',
    WORD_RAIN: 'Word Rain',
    ZOMBIE_TYPING_DEFENSE: 'Zombie Defense',
};

function dayKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function calculateStreak(history) {
    const days = new Set(
        history
            .map((game) => new Date(game.playedAt))
            .filter((date) => !Number.isNaN(date.getTime()))
            .map(dayKey),
    );

    const cursor = new Date();

    // A streak is still alive if the player has not played yet today.
    if (!days.has(dayKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;

    while (days.has(dayKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

export function summarizeHistory(history = []) {
    if (history.length === 0) {
        return {bestWpm: 0, avgWpm: 0, avgAccuracy: 0, streak: 0};
    }

    const recent = history.slice(0, 10);
    const average = (values) =>
        values.reduce((sum, value) => sum + value, 0) / values.length;

    return {
        bestWpm: Math.round(Math.max(...history.map((game) => game.wpm))),
        avgWpm: Math.round(average(recent.map((game) => game.wpm))),
        avgAccuracy: Math.round(average(recent.map((game) => game.accuracy))),
        streak: calculateStreak(history),
    };
}

// Monday to Sunday of the current week: which days had a game.
export function weekActivity(history) {
    const played = new Set(
        history
            .map((game) => new Date(game.playedAt))
            .filter((date) => !Number.isNaN(date.getTime()))
            .map(dayKey),
    );

    const today = new Date();
    const monday = new Date(today);

    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, index) => {
        const day = new Date(monday);

        day.setDate(monday.getDate() + index);

        return {
            letter,
            played: played.has(dayKey(day)),
            today: dayKey(day) === dayKey(today),
        };
    });
}

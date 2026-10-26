// Labels shared by the admin pages.

const GAME_NAMES = {
    TYPING_SPEED_CHALLENGE: 'Typing Speed',
    TYPING_RACE: 'Typing Racer',
    WORD_SURVIVAL: 'Word Survival',
    SPACE_MISSION: 'Space Mission',
    NINJA_WORD_STRIKE: 'Ninja Word Strike',
    WORD_RAIN: 'Word Rain (old)',
    ZOMBIE_TYPING_DEFENSE: 'Zombie Defense (old)',
};

export const gameName = (type) => GAME_NAMES[type] ?? type;

export const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'});
};


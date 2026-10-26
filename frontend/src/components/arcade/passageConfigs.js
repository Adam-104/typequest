// Settings for the two passage games. PassageArena reads these.

import {racePassages, speedPassages} from '../../data/passages';

export const speedConfig = {
    id: 'typing-speed',
    theme: 'speed',
    mode: 'timed',
    title: 'Typing Speed',
    gameType: 'TYPING_SPEED_CHALLENGE',
    difficulty: 'BEGINNER',
    durations: [30, 60, 120],
    defaultDuration: 60,
    passages: speedPassages,
    cue: 'Start typing to begin. The clock starts with your first key.',
    hint: 'Accuracy first, speed second. Esc restarts the same text.',
};

export const racerConfig = {
    id: 'typing-racer',
    theme: 'racer',
    mode: 'race',
    title: 'Typing Racer',
    gameType: 'TYPING_RACE',
    difficulty: 'INTERMEDIATE',
    passages: racePassages,
    pitch: 'Slide your key along the rail and reach Enter before the rival does.',
    rules: [
        'Type the passage exactly. Typos stay in the text until you fix them.',
        'The rival moves at a steady pace, so slow, careful typing can lose.',
        'Finish first to win the race.',
    ],
    rivalPerSecond: 1.35,
    rivalCap: 96,
    hint: 'Esc restarts the race. Enter starts a new one when you finish.',
};

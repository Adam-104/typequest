// Settings for the three word-arena games. The engine in useWordArena
// reads these; tweak numbers here to change difficulty.
//
// speed  – % of the play area crossed per second, at the start and end
// spawn  – milliseconds between new words, at the start and end

export const survivalConfig = {
    id: 'word-survival',
    theme: 'survival',
    title: 'Word Survival',
    gameType: 'WORD_SURVIVAL',
    difficulty: 'INTERMEDIATE',
    pitch: 'Words fall toward the space bar. Type each one before it lands.',
    rules: [
        'Type a word to clear it.',
        'A word that lands on the space bar costs a life.',
        'You have three lives and sixty seconds.',
    ],
    axis: 'y',
    duration: 60,
    escapeAt: 85,
    lanes: [20, 80],
    maxOnScreen: 5,
    speed: [6.2, 10],
    spawn: [1900, 1200],
    resource: {kind: 'lives', max: 3},
    combo: false,
    edgeLabel: 'space',
    endings: {time: 'Time’s up', resource: 'Out of lives'},
    words: [
        'react', 'java', 'code', 'speed', 'keyboard', 'developer', 'function',
        'array', 'object', 'logic', 'python', 'database', 'variable', 'method',
        'server', 'browser', 'frontend', 'backend', 'algorithm', 'debug',
        'computer', 'program', 'design', 'network', 'compile',
    ],
};

export const spaceConfig = {
    id: 'space-mission',
    theme: 'space',
    title: 'Space Mission',
    gameType: 'SPACE_MISSION',
    difficulty: 'BEGINNER',
    pitch: 'Asteroids are heading for your ship. Type their names to blast them apart.',
    rules: [
        'Type an asteroid’s word to destroy it.',
        'Every hit recovers 3% fuel. Every miss burns 15%.',
        'Keep fuel above zero for sixty seconds.',
    ],
    axis: 'y',
    duration: 60,
    escapeAt: 85,
    lanes: [20, 80],
    maxOnScreen: 5,
    speed: [5.4, 8.6],
    spawn: [1800, 1150],
    resource: {kind: 'fuel', max: 100, missCost: 15, killGain: 3},
    combo: false,
    edgeLabel: 'hull',
    endings: {time: 'Mission complete', resource: 'Out of fuel'},
    words: [
        'orbit', 'comet', 'galaxy', 'planet', 'rocket', 'cosmos', 'meteor',
        'lunar', 'solar', 'nebula', 'satellite', 'gravity', 'astronaut',
        'eclipse', 'mission', 'launch', 'universe', 'stardust', 'telescope',
        'asteroid', 'mars', 'venus', 'jupiter', 'supernova', 'spacecraft',
    ],
};

export const ninjaConfig = {
    id: 'ninja-word-strike',
    theme: 'ninja',
    title: 'Ninja Word Strike',
    gameType: 'NINJA_WORD_STRIKE',
    difficulty: 'ADVANCED',
    pitch: 'Targets sprint for the gate. Strike them in a chain to multiply your points.',
    rules: [
        'Type a word to strike it.',
        'Each strike in a row raises your multiplier, up to ×5.',
        'A target that reaches the Enter key costs a life and breaks the chain.',
    ],
    axis: 'x',
    duration: 60,
    escapeAt: 82,
    lanes: [14, 86],
    maxOnScreen: 6,
    speed: [7, 12],
    spawn: [1700, 1000],
    resource: {kind: 'lives', max: 3},
    combo: true,
    edgeLabel: 'enter',
    endings: {time: 'Training complete', resource: 'Out of lives'},
    words: [
        'ninja', 'strike', 'shadow', 'blade', 'swift', 'stealth', 'warrior',
        'dragon', 'attack', 'honor', 'samurai', 'combat', 'spirit', 'focus',
        'master', 'shuriken', 'silent', 'agility', 'power', 'skill',
        'phantom', 'thunder', 'legend',
    ],
};

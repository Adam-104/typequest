import {useCallback, useEffect, useRef, useState} from 'react';

import useGameSubmission from './useGameSubmission';
import useTypingStats from './useTypingStats';

const TICK_MS = 50;
const POP_LIFETIME_MS = 700;
const START_POS = -6;

const lerp = (from, to, t) => from + (to - from) * t;
const randomBetween = (min, max) => min + Math.random() * (max - min);

function readBest(id) {
    try {
        return Number(localStorage.getItem(`typequest-best-${id}`)) || 0;
    } catch {
        return 0;
    }
}

function writeBest(id, score) {
    try {
        localStorage.setItem(`typequest-best-${id}`, String(score));
    } catch {
        // Private mode or storage disabled: the best score just isn't kept.
    }
}

function newState(config) {
    return {
        words: [],
        pops: [],
        score: 0,
        elapsed: 0,
        timeLeft: config.duration,
        resource: config.resource.max,
        destroyed: 0,
        combo: 0,
        bestCombo: 0,
        missTick: 0,
        spawnClock: config.spawn[0],
        finished: false,
        seq: 0,
    };
}

function toView(state) {
    return {
        words: state.words.map((word) => ({...word})),
        pops: state.pops.map((pop) => ({...pop})),
        score: state.score,
        timeLeft: state.timeLeft,
        resource: state.resource,
        destroyed: state.destroyed,
        combo: state.combo,
        bestCombo: state.bestCombo,
        missTick: state.missTick,
    };
}

// Position of a word on screen as left/top percentages.
function place(config, word) {
    return config.axis === 'y'
        ? {left: word.lane, top: word.pos}
        : {left: word.pos, top: word.lane};
}

// Rough size of a keycap word as a percentage of the play area. Mirrors the
// --kc-size rules in arcade.css so spawning can keep words apart and inside.
function measureKeys() {
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    const narrow = width <= 640;

    const keyPx = narrow
        ? Math.min(27.2, Math.max(20.8, width * 0.052))
        : Math.min(41.6, Math.max(30.4, width * 0.027));

    const fieldWidth = Math.max(260, Math.min(width - 32, 1300));
    const fieldHeight = Math.max(narrow ? 288 : 352, height * 0.55);

    return {
        perLetter: ((keyPx + 3.2) / fieldWidth) * 100,
        rowHeight: ((keyPx * 1.5) / fieldHeight) * 100,
    };
}

function makeWord(config, state) {
    // Give every word on screen a different first letter, so the letters
    // typed so far always point at exactly one word.
    const firstLetters = new Set(state.words.map((word) => word.text[0]));
    const texts = new Set(state.words.map((word) => word.text));

    let pool = config.words.filter((text) => !firstLetters.has(text[0]));

    if (pool.length === 0) {
        pool = config.words.filter((text) => !texts.has(text));
    }

    const text = pool[Math.floor(Math.random() * pool.length)];

    // Pick the lane with the most clear space around it, so words do not
    // land on top of each other. Sizes are rough percentages of the play area.
    const vertical = config.axis === 'y';
    const {perLetter: percentPerLetter, rowHeight} = measureKeys();

    // Keep the whole word inside the play area when it travels downward.
    const halfWord = (text.length * percentPerLetter) / 2 + 1.5;
    const laneMin = vertical ? Math.min(50, Math.max(config.lanes[0], halfWord)) : config.lanes[0];
    const laneMax = vertical ? Math.max(50, Math.min(config.lanes[1], 100 - halfWord)) : config.lanes[1];

    let bestLane = randomBetween(laneMin, laneMax);
    let bestGap = -Infinity;

    for (let attempt = 0; attempt < 12; attempt += 1) {
        const lane = randomBetween(laneMin, laneMax);
        let gap = Infinity;

        for (const other of state.words) {
            const widthSum = (text.length + other.text.length) / 2 * percentPerLetter;
            const alongDistance = Math.abs(other.pos - START_POS);

            // Words far apart along their direction of travel cannot collide yet.
            const closeAlong = vertical
                ? alongDistance < rowHeight + 4
                : alongDistance < widthSum + 4;

            if (!closeAlong) continue;

            const acrossDistance = Math.abs(other.lane - lane);

            gap = Math.min(gap, vertical ? acrossDistance - widthSum : acrossDistance - rowHeight);
        }

        if (gap > bestGap) {
            bestGap = gap;
            bestLane = lane;
        }
    }

    state.seq += 1;

    return {
        id: state.seq,
        text,
        lane: bestLane,
        pos: START_POS,
        // Nearly identical speeds, so later words rarely catch up with earlier ones.
        k: randomBetween(0.95, 1.05),
    };
}

// Game engine shared by Word Survival, Space Mission and Ninja Word Strike.
export default function useWordArena(config) {
    const [status, setStatus] = useState('ready'); // ready | playing | paused | finished
    const [input, setInput] = useState('');
    const [view, setView] = useState(() => toView(newState(config)));
    const [result, setResult] = useState(null);
    const [best, setBest] = useState(() => readBest(config.id));

    const state = useRef(newState(config));

    const {
        reset: resetStats,
        recordInput,
        recordWord,
        snapshot,
        claimSubmission,
        pause: pauseStats,
        resume: resumeStats,
    } = useTypingStats();
    const {submission, submit, retry, reset: resetSubmission} = useGameSubmission();

    const finish = useCallback((reason) => {
        const current = state.current;

        if (current.finished) return;

        current.finished = true;

        const stats = snapshot();
        const previousBest = readBest(config.id);
        const isBest = current.score > previousBest;

        if (isBest) writeBest(config.id, current.score);

        setBest(Math.max(previousBest, current.score));
        setResult({
            reason,
            score: current.score,
            destroyed: current.destroyed,
            bestCombo: current.bestCombo,
            isBest,
            wpm: stats.wpm,
            accuracy: stats.accuracy,
        });
        setView(toView(current));
        setInput('');
        setStatus('finished');

        if (claimSubmission() && stats.correctCharacters > 0) {
            submit({
                ...stats,
                gameType: config.gameType,
                difficulty: config.difficulty,
            });
        }
    }, [config, snapshot, claimSubmission, submit]);

    const step = useCallback((dt) => {
        const current = state.current;

        if (current.finished) return;

        current.elapsed += dt;
        current.timeLeft = Math.max(0, current.timeLeft - dt / 1000);

        const progress = Math.min(1, current.elapsed / (config.duration * 1000));
        const speed = lerp(config.speed[0], config.speed[1], progress);

        for (const word of current.words) {
            word.pos += speed * word.k * (dt / 1000);
        }

        const escaped = current.words.filter((word) => word.pos >= config.escapeAt);

        if (escaped.length > 0) {
            current.words = current.words.filter((word) => word.pos < config.escapeAt);
            current.combo = 0;
            current.missTick += 1;

            const cost = config.resource.kind === 'lives'
                ? escaped.length
                : config.resource.missCost * escaped.length;

            current.resource = Math.max(0, current.resource - cost);
        }

        current.spawnClock += dt;

        if (
            current.spawnClock >= lerp(config.spawn[0], config.spawn[1], progress)
            && current.words.length < config.maxOnScreen
        ) {
            current.words.push(makeWord(config, current));
            current.spawnClock = 0;
        }

        current.pops = current.pops.filter(
            (pop) => current.elapsed - pop.at < POP_LIFETIME_MS,
        );

        if (current.resource <= 0) {
            finish('resource');
        } else if (current.timeLeft <= 0) {
            finish('time');
        } else {
            setView(toView(current));
        }
    }, [config, finish]);

    // Game loop: only runs while playing, so pausing freezes everything.
    useEffect(() => {
        if (status !== 'playing') return undefined;

        let last = performance.now();

        const timer = setInterval(() => {
            const now = performance.now();
            const dt = Math.min(100, now - last);

            last = now;
            step(dt);
        }, TICK_MS);

        return () => clearInterval(timer);
    }, [status, step]);

    const start = useCallback(() => {
        resetStats();
        resetSubmission();
        state.current = newState(config);
        setInput('');
        setResult(null);
        setView(toView(state.current));
        setStatus('playing');
    }, [config, resetStats, resetSubmission]);

    const pause = useCallback(() => {
        if (status !== 'playing') return;

        pauseStats();
        setStatus('paused');
    }, [status, pauseStats]);

    const resume = useCallback(() => {
        if (status !== 'paused') return;

        resumeStats();
        setStatus('playing');
    }, [status, resumeStats]);

    // Pause automatically when the player switches tabs.
    useEffect(() => {
        function handleVisibility() {
            if (document.hidden) pause();
        }

        document.addEventListener('visibilitychange', handleVisibility);

        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [pause]);

    const destroy = useCallback((word) => {
        const current = state.current;

        current.words = current.words.filter((item) => item.id !== word.id);

        const multiplier = config.combo ? Math.min(5, current.combo + 1) : 1;
        const points = word.text.length * 10 * multiplier;

        current.combo += 1;
        current.bestCombo = Math.max(current.bestCombo, current.combo);
        current.score += points;
        current.destroyed += 1;

        if (config.resource.kind === 'fuel') {
            current.resource = Math.min(
                config.resource.max,
                current.resource + config.resource.killGain,
            );
        }

        current.seq += 1;
        current.pops.push({
            id: `pop-${current.seq}`,
            text: `+${points}`,
            at: current.elapsed,
            ...place(config, word),
        });

        recordWord(word.text.length);
        setInput('');
        setView(toView(current));
    }, [config, recordWord]);

    const changeInput = useCallback((rawValue) => {
        if (status !== 'playing') return;

        const value = rawValue.toLowerCase().replace(/[^a-z]/g, '');

        recordInput(value);

        const hit = state.current.words.find((word) => word.text === value);

        if (hit) {
            destroy(hit);
        } else {
            setInput(value);
        }
    }, [status, recordInput, destroy]);

    return {
        status,
        input,
        view,
        result,
        best,
        submission,
        retry,
        start,
        pause,
        resume,
        changeInput,
        clearInput: () => setInput(''),
        place: (word) => place(config, word),
    };
}

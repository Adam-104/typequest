import {useCallback, useEffect, useRef, useState} from 'react';

import {recordKeystrokes} from '../utils/keyStats';
import {playSound, playTyping} from '../utils/soundEngine';

function countCorrect(typed, target) {
    let correct = 0;

    for (let index = 0; index < typed.length; index += 1) {
        if (typed[index] === target[index]) correct += 1;
    }

    return correct;
}

// Typing engine for one exercise (a lesson or a practice drill).
//
//   completeWhen 'match'  – finish when the text is typed exactly right
//   completeWhen 'length' – finish when the last character is typed, mistakes included
//   timeLimitSec          – optional hard time limit
//
// Accuracy counts every key pressed, so a corrected typo still lowers it.
export default function useTypingDrill({
    target,
    completeWhen = 'length',
    timeLimitSec = 0,
    onFinish,
}) {
    const [phase, setPhase] = useState('ready'); // ready | playing | finished
    const [typed, setTyped] = useState('');
    const [elapsedMs, setElapsedMs] = useState(0);
    const [flash, setFlash] = useState(null);
    const [result, setResult] = useState(null);

    const inputRef = useRef(null);
    const typedRef = useRef('');
    const startedAt = useRef(0);
    const lastKeyAt = useRef(0);
    const entries = useRef([]);
    const totals = useRef({keys: 0, wrong: 0});
    const finishedRef = useRef(false);
    const onFinishRef = useRef(onFinish);

    useEffect(() => {
        onFinishRef.current = onFinish;
    }, [onFinish]);

    const finish = useCallback((reason) => {
        if (finishedRef.current) return;

        finishedRef.current = true;

        const value = typedRef.current;
        const rawMs = performance.now() - startedAt.current;
        const ms = reason === 'time' ? timeLimitSec * 1000 : rawMs;
        const seconds = Math.max(1, ms / 1000);
        const correct = countCorrect(value, target);
        const {keys, wrong} = totals.current;

        const summary = {
            reason,
            completed: value === target,
            wpm: Math.min(300, Math.round(correct / 5 / (seconds / 60))),
            accuracy: keys ? Math.round(((keys - wrong) / keys) * 100) : 100,
            mistakes: wrong,
            seconds: Math.round(seconds),
            correctChars: correct,
            typedChars: value.length,
        };

        recordKeystrokes(entries.current);
        setElapsedMs(ms);
        setResult(summary);
        setPhase('finished');
        playSound(summary.accuracy >= 80 ? 'win' : 'click');
        onFinishRef.current?.(summary, entries.current);
    }, [target, timeLimitSec]);

    useEffect(() => {
        if (phase !== 'playing') return undefined;

        const timer = setInterval(() => {
            const ms = performance.now() - startedAt.current;

            setElapsedMs(ms);

            if (timeLimitSec > 0 && ms >= timeLimitSec * 1000) finish('time');
        }, 100);

        return () => clearInterval(timer);
    }, [phase, timeLimitSec, finish]);

    const reset = useCallback(() => {
        finishedRef.current = false;
        typedRef.current = '';
        entries.current = [];
        totals.current = {keys: 0, wrong: 0};
        setTyped('');
        setElapsedMs(0);
        setFlash(null);
        setResult(null);
        setPhase('ready');
    }, []);

    // A new target always starts a fresh exercise.
    useEffect(() => {
        reset();
    }, [target, reset]);

    const handleChange = useCallback((event) => {
        if (finishedRef.current) return;

        const value = event.target.value.replace(/\n/g, '').slice(0, target.length);
        const previous = typedRef.current;
        const now = performance.now();

        if (!previous.length && value.length && phase === 'ready') {
            startedAt.current = now;
            lastKeyAt.current = now;
            setPhase('playing');
        }

        if (value.length > previous.length) {
            for (let index = previous.length; index < value.length; index += 1) {
                const ok = value[index] === target[index];

                totals.current.keys += 1;

                if (!ok) totals.current.wrong += 1;

                playTyping(target[index], ok);

                entries.current.push({
                    char: target[index],
                    ok,
                    gapMs: now - lastKeyAt.current,
                });
                setFlash({char: target[index], ok, id: totals.current.keys});
            }

            lastKeyAt.current = now;
        }

        typedRef.current = value;
        setTyped(value);

        const done = completeWhen === 'match' ? value === target : value.length >= target.length;

        if (done) finish('complete');
    }, [target, phase, completeWhen, finish]);

    const correct = countCorrect(typed, target);
    const seconds = elapsedMs / 1000;

    return {
        phase,
        typed,
        elapsedMs,
        flash,
        result,
        inputRef,
        handleChange,
        reset,
        stop: finish,
        correct,
        mistakesNow: typed.length - correct,
        accuracy: totals.current.keys
            ? Math.round(((totals.current.keys - totals.current.wrong) / totals.current.keys) * 100)
            : 100,
        liveWpm: elapsedMs >= 1500 ? Math.min(300, Math.round(correct / 5 / (seconds / 60))) : 0,
        wrongKeys: totals.current.wrong,
    };
}

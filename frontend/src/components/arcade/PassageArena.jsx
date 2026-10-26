import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import useGameSubmission from '../../hooks/useGameSubmission';
import useSound from '../../hooks/useSound';
import SoundToggle from './SoundToggle';
import RewardBanner from '../RewardBanner';
import '../../styles/keycap.css';
import '../../styles/arcade.css';
import '../../styles/passage.css';
import '../../styles/paper-play.css';

const COUNTDOWN_STEP_MS = 800;
const WIN_MARGIN = 95; // the rival "has won" if it is at or past this when you finish

function pickPassage(list, previous = '') {
    const choices = list.filter((text) => text !== previous);

    return choices[Math.floor(Math.random() * choices.length)] ?? list[0];
}

function measure(typed, passage) {
    let correct = 0;

    for (let index = 0; index < typed.length; index += 1) {
        if (typed[index] === passage[index]) correct += 1;
    }

    return {
        correct,
        mistakes: typed.length - correct,
        accuracy: typed.length ? Math.round((correct / typed.length) * 100) : 100,
    };
}

function formatClock(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));

    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function readBest(id) {
    try {
        return Number(localStorage.getItem(`typequest-best-wpm-${id}`)) || 0;
    } catch {
        return 0;
    }
}

function writeBest(id, wpm) {
    try {
        localStorage.setItem(`typequest-best-wpm-${id}`, String(wpm));
    } catch {
        // Private mode: the best score just is not kept.
    }
}

// Game for the two passage games: the timed Typing Speed test and the
// Typing Racer, where a rival races you to the Enter key.
export default function PassageArena({config}) {
    const navigate = useNavigate();
    const isRace = config.mode === 'race';

    const [phase, setPhase] = useState('ready'); // ready | countdown | playing | finished
    const [duration, setDuration] = useState(config.defaultDuration ?? 60);
    const [passage, setPassage] = useState(() => pickPassage(config.passages));
    const [typed, setTyped] = useState('');
    const [elapsedMs, setElapsedMs] = useState(0);
    const [countdown, setCountdown] = useState(null);
    const [result, setResult] = useState(null);
    const [best, setBest] = useState(() => readBest(config.id));

    const inputRef = useRef(null);
    const startedAt = useRef(0);
    const typedRef = useRef('');
    const finishedRef = useRef(false);

    const {play, typeKey} = useSound();
    const {submission, submit, retry, reset: resetSubmission} = useGameSubmission();

    const rivalAt = useCallback(
        (ms) => Math.min(config.rivalCap ?? 96, (ms / 1000) * (config.rivalPerSecond ?? 1.35)),
        [config],
    );

    const begin = useCallback(() => {
        startedAt.current = performance.now();
        setElapsedMs(0);
        setPhase('playing');
    }, []);

    const finish = useCallback((reason) => {
        if (finishedRef.current) return;

        finishedRef.current = true;

        const value = typedRef.current;
        const ms = reason === 'time' ? duration * 1000 : performance.now() - startedAt.current;
        const seconds = Math.max(1, Math.round(ms / 1000));
        const {correct, mistakes, accuracy} = measure(value, passage);
        const wpm = Math.min(300, Math.round(correct / 5 / (seconds / 60)));
        const won = isRace && rivalAt(ms) < WIN_MARGIN;
        const previousBest = readBest(config.id);
        const isBest = wpm > previousBest;

        if (isBest) writeBest(config.id, wpm);

        setBest(Math.max(previousBest, wpm));
        setElapsedMs(ms);
        setResult({wpm, accuracy, mistakes, seconds, won, isBest, reason});
        setPhase('finished');
        play(isBest ? 'best' : won || !isRace ? 'win' : 'lose');

        if (correct > 0) {
            submit({
                wpm,
                accuracy,
                correctCharacters: correct,
                incorrectCharacters: mistakes,
                durationSeconds: seconds,
                gameType: config.gameType,
                difficulty: config.difficulty,
            });
        }
    }, [config, duration, passage, isRace, rivalAt, play, submit]);

    // Clock while playing.
    useEffect(() => {
        if (phase !== 'playing') return undefined;

        const timer = setInterval(() => {
            const ms = performance.now() - startedAt.current;

            setElapsedMs(ms);

            if (!isRace && ms >= duration * 1000) finish('time');
        }, 100);

        return () => clearInterval(timer);
    }, [phase, isRace, duration, finish]);

    // 3, 2, 1, GO before a race.
    useEffect(() => {
        if (phase !== 'countdown') return undefined;

        if (countdown > 0) play('tick');

        const timer = setTimeout(() => {
            if (countdown <= 0) {
                setCountdown(null);
                begin();
                play('go');
            } else {
                setCountdown(countdown - 1);
            }
        }, COUNTDOWN_STEP_MS);

        return () => clearTimeout(timer);
    }, [phase, countdown, begin, play]);

    // Keep the cursor in the (invisible) typing box.
    useEffect(() => {
        if (phase === 'playing' || (phase === 'ready' && !isRace)) {
            inputRef.current?.focus();
        }
    }, [phase, isRace]);

    const restart = useCallback((newText) => {
        finishedRef.current = false;
        typedRef.current = '';
        resetSubmission();
        setTyped('');
        setElapsedMs(0);
        setCountdown(null);
        setResult(null);
        setPhase('ready');

        if (newText) {
            setPassage((current) => pickPassage(config.passages, current));
        }
    }, [config, resetSubmission]);

    const startRace = useCallback(() => {
        if (phase !== 'ready') return;

        setCountdown(3);
        setPhase('countdown');
    }, [phase]);

    // Esc restarts; Enter starts a race or plays again.
    useEffect(() => {
        function handleKey(event) {
            if (event.key === 'Escape' && phase !== 'ready') {
                restart(false);
            } else if (event.key === 'Enter') {
                if (event.target.closest?.('button, a')) return;

                if (phase === 'ready' && isRace) {
                    event.preventDefault();
                    startRace();
                } else if (phase === 'finished') {
                    event.preventDefault();
                    restart(true);
                }
            }
        }

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [phase, isRace, restart, startRace]);

    function handleChange(event) {
        if (phase === 'finished' || phase === 'countdown') return;
        if (isRace && phase === 'ready') return;

        const value = event.target.value.replace(/\n/g, '').slice(0, passage.length);

        if (value.length > typedRef.current.length) {
            const latest = value.length - 1;

            typeKey(passage[latest], value[latest] === passage[latest]);
        }

        typedRef.current = value;
        setTyped(value);

        if (phase === 'ready') begin();

        const done = isRace ? value === passage : value.length >= passage.length;

        if (done) finish('complete');
    }

    function chooseDuration(seconds) {
        if (phase === 'playing') return;

        setDuration(seconds);
        restart(false);
    }

    const live = measure(typed, passage);
    const elapsedSeconds = elapsedMs / 1000;
    const liveWpm = elapsedMs >= 1500
        ? Math.min(300, Math.round(live.correct / 5 / (elapsedSeconds / 60)))
        : 0;
    const timeLeft = Math.max(0, duration - elapsedSeconds);
    const you = Math.min(100, (typed.length / passage.length) * 100);
    const rival = rivalAt(elapsedMs);
    const playing = phase === 'playing';

    const characters = useMemo(
        () => passage.split('').map((char, index) => {
            let state = 'kc-ch';

            if (index < typed.length) {
                state += typed[index] === char ? ' is-ok' : ' is-bad';
            } else if (index === typed.length && (phase === 'playing' || phase === 'ready')) {
                state += ' is-current';
            }

            return <span key={index} className={state}>{char}</span>;
        }),
        [passage, typed, phase],
    );

    const announcement = phase === 'finished' && result
        ? `Finished. ${result.wpm} words per minute, ${result.accuracy} percent accuracy.`
        : '';

    return (
        <main className={`kc kc--paper kc-page kc--${config.theme}`}>
            <header className="kc-topbar">
                <button
                    type="button"
                    className="kc-btn kc-btn--ghost kc-btn--sm"
                    onClick={() => navigate('/games')}
                >
                    ← Games
                </button>

                <h1 className="kc-title">{config.title}</h1>

                <div className="kc-topbar-right">
                    <span className="kc-best">
                        Best <strong>{best}</strong> WPM
                    </span>

                    <SoundToggle/>
                </div>
            </header>

            <section className="kc-console" aria-label="Game status">
                <div className="kc-stat">
                    <span className="kc-stat-label">Speed</span>
                    <strong className="kc-stat-value">{liveWpm} <small>WPM</small></strong>
                </div>

                <div className="kc-stat">
                    <span className="kc-stat-label">Accuracy</span>
                    <strong className="kc-stat-value">{live.accuracy}%</strong>
                </div>

                <div className="kc-stat">
                    <span className="kc-stat-label">{isRace ? 'Race clock' : 'Time left'}</span>
                    <strong
                        className="kc-stat-value"
                        data-urgent={!isRace && playing && timeLeft <= 10}
                    >
                        {isRace ? formatClock(elapsedSeconds) : formatClock(timeLeft)}
                    </strong>
                    {!isRace && (
                        <div className="kc-meter" aria-hidden="true">
                            <div
                                className="kc-meter-fill"
                                style={{width: `${(timeLeft / duration) * 100}%`}}
                            />
                        </div>
                    )}
                </div>

                <div className="kc-stat">
                    <span className="kc-stat-label">Mistakes</span>
                    <strong className="kc-stat-value">{live.mistakes}</strong>
                </div>
            </section>

            <section className="kc-field kc-field--passage" aria-label="Typing area">
                {isRace && (
                    <div className="kc-track" aria-label="Race progress">
                        {[
                            ['you', you, 'is-you', 'You'],
                            ['rival', rival, 'is-rival', 'Rival'],
                        ].map(([id, progress, tone, label]) => (
                            <div className="kc-rail" key={id}>
                                <span className="kc-rail-name">{label}</span>
                                <div className="kc-lane">
                                    <div className="kc-lane-run">
                                        <span
                                            className={`kc-racer ${tone}`}
                                            style={{left: `${progress}%`}}
                                        >
                                            {id}
                                        </span>
                                    </div>
                                    <span className="kc-finish" aria-hidden="true">enter</span>
                                </div>
                                <span className="kc-rail-percent">{Math.round(progress)}%</span>
                            </div>
                        ))}
                    </div>
                )}

                <div
                    className="kc-passage-wrap"
                    onClick={() => inputRef.current?.focus()}
                >
                    <p className="kc-passage" aria-hidden="true">{characters}</p>

                    <textarea
                        ref={inputRef}
                        className="kc-capture"
                        value={typed}
                        onChange={handleChange}
                        onPaste={(event) => event.preventDefault()}
                        onContextMenu={(event) => event.preventDefault()}
                        disabled={phase === 'finished' || phase === 'countdown'}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        aria-label="Type the passage shown above"
                    />
                </div>

                {phase === 'ready' && !isRace && (
                    <p className="kc-cue">{config.cue}</p>
                )}

                <div className="kc-tools">
                    {!isRace && (
                        <div className="kc-segment" role="group" aria-label="Test length">
                            {config.durations.map((seconds) => (
                                <button
                                    key={seconds}
                                    type="button"
                                    className="kc-seg-btn"
                                    aria-pressed={duration === seconds}
                                    disabled={playing}
                                    onClick={() => chooseDuration(seconds)}
                                >
                                    {seconds}s
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="kc-tools-actions">
                        <button
                            type="button"
                            className="kc-btn kc-btn--ghost kc-btn--sm"
                            onClick={() => restart(true)}
                            disabled={playing && typed.length === 0}
                        >
                            New text
                        </button>
                        <button
                            type="button"
                            className="kc-btn kc-btn--sm"
                            onClick={() => restart(false)}
                            disabled={phase === 'ready'}
                        >
                            Restart <kbd>Esc</kbd>
                        </button>
                    </div>
                </div>

                {isRace && phase === 'ready' && (
                    <div className="kc-overlay">
                        <div className="kc-card">
                            <h2>{config.title}</h2>
                            <p className="kc-card-lead">{config.pitch}</p>

                            <ul className="kc-rules">
                                {config.rules.map((rule) => (
                                    <li key={rule}>{rule}</li>
                                ))}
                            </ul>

                            <div className="kc-card-actions">
                                <button
                                    type="button"
                                    className="kc-btn kc-btn--primary"
                                    onClick={startRace}
                                    autoFocus
                                >
                                    Start race <kbd>Enter</kbd>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'countdown' && (
                    <div className="kc-overlay kc-overlay--light" aria-live="assertive">
                        <span className="kc-key kc-countdown">
                            {countdown === 0 ? 'Go' : countdown}
                        </span>
                    </div>
                )}

                {phase === 'finished' && result && (
                    <div className="kc-overlay">
                        <div className="kc-card">
                            <h2>
                                {isRace
                                    ? (result.won ? 'You won the race' : 'The rival got there first')
                                    : (result.reason === 'time' ? 'Time’s up' : 'Passage complete')}
                            </h2>

                            <p className="kc-card-score">
                                <strong>{result.wpm}</strong> WPM
                                {result.isBest && <span className="kc-badge">New best</span>}
                            </p>

                            <dl className="kc-results">
                                <div>
                                    <dt>Accuracy</dt>
                                    <dd>{result.accuracy}%</dd>
                                </div>
                                <div>
                                    <dt>Mistakes</dt>
                                    <dd>{result.mistakes}</dd>
                                </div>
                                <div>
                                    <dt>Time</dt>
                                    <dd>{result.seconds}s</dd>
                                </div>
                            </dl>

                            <RewardBanner submission={submission} onRetry={retry}/>

                            <div className="kc-card-actions">
                                <button
                                    type="button"
                                    className="kc-btn kc-btn--primary"
                                    onClick={() => restart(true)}
                                    autoFocus
                                >
                                    {isRace ? 'Race again' : 'Try again'} <kbd>Enter</kbd>
                                </button>
                                <button
                                    type="button"
                                    className="kc-btn kc-btn--ghost"
                                    onClick={() => navigate('/games')}
                                >
                                    All games
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <p className="kc-hint kc-hint--page">{config.hint}</p>

            <div className="kc-sr" role="status" aria-live="polite">
                {announcement}
            </div>
        </main>
    );
}

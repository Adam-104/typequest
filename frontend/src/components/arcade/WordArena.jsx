import {useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';

import useSound from '../../hooks/useSound';
import useWordArena from '../../hooks/useWordArena';
import RewardBanner from '../RewardBanner';
import '../../styles/keycap.css';
import '../../styles/arcade.css';
import '../../styles/paper-play.css';
import SoundToggle from './SoundToggle';

function Keys({text, typed = 0}) {
    return text.split('').map((letter, index) => (
        <span
            key={index}
            className={index < typed ? 'kc-key is-typed' : 'kc-key'}
        >
            {letter}
        </span>
    ));
}

export default function WordArena({config}) {
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const arena = useWordArena(config);
    const {status, input, view, result, best, submission} = arena;
    const {start, pause, resume, changeInput, clearInput, retry} = arena;

    const playing = status === 'playing';
    const paused = status === 'paused';

    // Keep the cursor in the typing box while a game is running.
    useEffect(() => {
        if (playing) inputRef.current?.focus();
    }, [playing]);

    // Keyboard shortcuts: Esc pauses, Enter starts or restarts.
    useEffect(() => {
        function handleKey(event) {
            if (event.key === 'Escape') {
                if (playing) pause();
                else if (paused) resume();
            } else if (event.key === 'Enter' && !playing && !paused) {
                if (event.target.closest?.('button, a')) return;

                event.preventDefault();
                start();
            }
        }

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [playing, paused, pause, resume, start]);

    // Sound effects. Every game has its own way of clearing a word.
    const {play, typeKey} = useSound();
    const previous = useRef({status: 'ready', score: 0, missTick: 0, input: ''});

    useEffect(() => {
        const before = previous.current;

        if (status === 'playing' && before.status === 'ready') play('go');
        else if (status === 'playing' && before.status === 'finished') play('go');
        else if (status === 'paused' && before.status === 'playing') play('pause');
        else if (status === 'playing' && before.status === 'paused') play('resume');

        if (status === 'playing' && view.score > before.score) {
            const step = Math.max(0, view.combo - 1);

            if (config.theme === 'space') {
                play('laser');
                setTimeout(() => play('explode'), 70);
            } else if (config.theme === 'ninja') {
                play('slash', {step});
                setTimeout(() => play('hit', {step}), 60);
            } else {
                play('hit', {step});
            }
        }

        if (status === 'playing' && view.missTick > before.missTick) {
            play('thud');
            if (config.resource.kind === 'lives') setTimeout(() => play('life'), 160);
        }

        if (status === 'finished' && before.status !== 'finished' && result) {
            if (result.isBest) play('best');
            else if (result.reason === 'resource') play('lose');
            else play('win');
        }

        previous.current = {...before, status, score: view.score, missTick: view.missTick};
    }, [status, view.score, view.combo, view.missTick, result, config, play]);

    // A new game starts the counters from zero again.
    useEffect(() => {
        if (status === 'ready') previous.current = {...previous.current, score: 0, missTick: 0};
    }, [status]);

    function typeInto(value) {
        const before = previous.current.input;

        if (value.length > before.length) {
            const char = value[value.length - 1];
            const matches = view.words.some((word) => word.text.startsWith(value));

            typeKey(char, matches);
        }

        previous.current.input = value;
        changeInput(value);
    }

    // Which word the letters typed so far point at.
    const target = input ? view.words.find((word) => word.text.startsWith(input)) : null;
    const mistyped = Boolean(input) && !target;

    const multiplier = Math.min(5, view.combo + 1);
    const timePercent = Math.max(0, (view.timeLeft / config.duration) * 100);
    const fuelLevel = view.resource > 50 ? 'high' : view.resource > 25 ? 'mid' : 'low';

    const announcement = status === 'finished' && result
        ? `${config.endings[result.reason]}. Score ${result.score}.`
        : paused ? 'Paused.' : '';

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
                        Best <strong>{best}</strong>
                    </span>

                    <SoundToggle/>

                    {(playing || paused) && (
                        <button
                            type="button"
                            className="kc-btn kc-btn--ghost kc-btn--sm"
                            onClick={playing ? pause : resume}
                        >
                            {paused ? 'Resume' : 'Pause'} <kbd>Esc</kbd>
                        </button>
                    )}
                </div>
            </header>

            <section className="kc-console" aria-label="Game status">
                <div className="kc-stat">
                    <span className="kc-stat-label">Score</span>
                    <strong className="kc-stat-value">{view.score}</strong>
                </div>

                <div className="kc-stat">
                    <span className="kc-stat-label">Time</span>
                    <strong
                        className="kc-stat-value"
                        data-urgent={playing && view.timeLeft <= 10}
                    >
                        {Math.ceil(view.timeLeft)}s
                    </strong>
                    <div className="kc-meter" aria-hidden="true">
                        <div
                            className="kc-meter-fill"
                            style={{width: `${timePercent}%`}}
                        />
                    </div>
                </div>

                {config.resource.kind === 'lives' ? (
                    <div className="kc-stat">
                        <span className="kc-stat-label">Lives</span>
                        <div
                            className="kc-lives"
                            role="img"
                            aria-label={`${view.resource} of ${config.resource.max} lives left`}
                        >
                            {Array.from({length: config.resource.max}, (_, index) => (
                                <span
                                    key={index}
                                    className={
                                        index < view.resource
                                            ? 'kc-key kc-heart'
                                            : 'kc-key kc-heart is-typed is-lost'
                                    }
                                >
                                    ♥
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="kc-stat">
                        <span className="kc-stat-label">Fuel</span>
                        <strong className="kc-stat-value">{view.resource}%</strong>
                        <div className="kc-meter" data-level={fuelLevel} aria-hidden="true">
                            <div
                                className="kc-meter-fill"
                                style={{width: `${view.resource}%`}}
                            />
                        </div>
                    </div>
                )}

                {config.combo && (
                    <div className="kc-stat">
                        <span className="kc-stat-label">Multiplier</span>
                        <strong className="kc-stat-value" data-chain={view.combo > 0}>
                            ×{multiplier}
                        </strong>
                        <span className="kc-stat-note">
                            Chain of {view.combo}
                        </span>
                    </div>
                )}
            </section>

            <section className={`kc-field kc-field--${config.axis}`} aria-label="Play area">
                {view.missTick > 0 && (
                    <div key={view.missTick} className="kc-flash" aria-hidden="true"/>
                )}

                {view.words.map((word) => {
                    const isTarget = target?.id === word.id;
                    const spot = arena.place(word);

                    return (
                        <div
                            key={word.id}
                            className={
                                'kc-word'
                                + (isTarget ? ' is-target' : '')
                                + (input && !isTarget ? ' is-dim' : '')
                                + (word.pos > config.escapeAt - 16 ? ' is-near' : '')
                            }
                            style={{left: `${spot.left}%`, top: `${spot.top}%`}}
                        >
                            <Keys text={word.text} typed={isTarget ? input.length : 0}/>
                        </div>
                    );
                })}

                {view.pops.map((pop) => (
                    <span
                        key={pop.id}
                        className="kc-pop"
                        style={{left: `${pop.left}%`, top: `${pop.top}%`}}
                        aria-hidden="true"
                    >
                        {pop.text}
                    </span>
                ))}

                <div className="kc-edge" aria-hidden="true">
                    <span>{config.edgeLabel}</span>
                </div>

                {status === 'ready' && (
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
                                    onClick={start}
                                    autoFocus
                                >
                                    Start <kbd>Enter</kbd>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {paused && (
                    <div className="kc-overlay">
                        <div className="kc-card kc-card--small">
                            <h2>Paused</h2>
                            <p className="kc-card-lead">
                                Your words are frozen. Take a breath.
                            </p>

                            <div className="kc-card-actions">
                                <button
                                    type="button"
                                    className="kc-btn kc-btn--primary"
                                    onClick={resume}
                                    autoFocus
                                >
                                    Resume <kbd>Esc</kbd>
                                </button>
                                <button
                                    type="button"
                                    className="kc-btn kc-btn--ghost"
                                    onClick={() => navigate('/games')}
                                >
                                    Quit
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'finished' && result && (
                    <div className="kc-overlay">
                        <div className="kc-card">
                            <h2>{config.endings[result.reason]}</h2>

                            <p className="kc-card-score">
                                <strong>{result.score}</strong> points
                                {result.isBest && (
                                    <span className="kc-badge">New best</span>
                                )}
                            </p>

                            <dl className="kc-results">
                                <div>
                                    <dt>Words cleared</dt>
                                    <dd>{result.destroyed}</dd>
                                </div>
                                <div>
                                    <dt>Speed</dt>
                                    <dd>{result.wpm} WPM</dd>
                                </div>
                                <div>
                                    <dt>Accuracy</dt>
                                    <dd>{result.accuracy}%</dd>
                                </div>
                                {config.combo && (
                                    <div>
                                        <dt>Longest chain</dt>
                                        <dd>{result.bestCombo}</dd>
                                    </div>
                                )}
                            </dl>

                            <RewardBanner submission={submission} onRetry={retry}/>

                            <div className="kc-card-actions">
                                <button
                                    type="button"
                                    className="kc-btn kc-btn--primary"
                                    onClick={start}
                                    autoFocus
                                >
                                    Play again <kbd>Enter</kbd>
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

            <form
                className="kc-inputbar"
                onSubmit={(event) => {
                    event.preventDefault();
                    clearInput();
                }}
            >
                <label className="kc-sr" htmlFor={`${config.id}-input`}>
                    Type the word you want to clear
                </label>

                <input
                    id={`${config.id}-input`}
                    ref={inputRef}
                    className="kc-input"
                    data-invalid={mistyped}
                    type="text"
                    value={input}
                    onChange={(event) => typeInto(event.target.value)}
                    placeholder={playing ? 'Type a word…' : 'Start a game to type'}
                    disabled={!playing}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                />

                <p className="kc-hint">
                    {mistyped
                        ? 'No word starts with that. Backspace to fix it.'
                        : 'Words clear as soon as you finish them. Enter clears the box.'}
                </p>
            </form>

            <div className="kc-sr" role="status" aria-live="polite">
                {announcement}
            </div>
        </main>
    );
}

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import Keyboard from '../components/Keyboard';
import useTypingDrill from '../hooks/useTypingDrill';
import {FOCUS_OPTIONS, buildDrillText} from '../utils/drillText';
import {clearKeyStats, totalKeystrokes, weakestKeys} from '../utils/keyStats';
import '../styles/keycap.css';
import '../styles/arcade.css';
import '../styles/passage.css';
import '../styles/practice.css';
import '../styles/paper-play.css';

const LENGTHS = [
    {id: 15, label: 'Short', note: '15 words'},
    {id: 30, label: 'Medium', note: '30 words'},
    {id: 60, label: 'Long', note: '60 words'},
];

const KEY_NAMES = {' ': 'space', ',': 'comma', '.': 'full stop', ';': 'semicolon', ':': 'colon', '\'': 'apostrophe', '"': 'quote', '-': 'hyphen'};

const keyName = (char) => KEY_NAMES[char] ?? char;

function readSetting(name, fallback) {
    try {
        return localStorage.getItem(`typequest-practice-${name}`) ?? fallback;
    } catch {
        return fallback;
    }
}

function writeSetting(name, value) {
    try {
        localStorage.setItem(`typequest-practice-${name}`, String(value));
    } catch {
        // Not saving the choice is fine.
    }
}

const clock = (ms) => {
    const total = Math.floor(ms / 1000);

    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export default function PracticePage() {
    const navigate = useNavigate();

    const [stage, setStage] = useState('setup'); // setup | drill
    const [focus, setFocus] = useState(() => readSetting('focus', 'home'));
    const [length, setLength] = useState(() => Number(readSetting('length', 30)));
    const [showKeyboard, setShowKeyboard] = useState(() => readSetting('keyboard', 'on') === 'on');
    const [target, setTarget] = useState('');
    const [statsVersion, setStatsVersion] = useState(0);

    // Re-read when a drill finishes or the stats are cleared.
    const weak = useMemo(() => weakestKeys(6, 5), [statsVersion]); // eslint-disable-line react-hooks/exhaustive-deps
    const keystrokes = useMemo(() => totalKeystrokes(), [statsVersion]); // eslint-disable-line react-hooks/exhaustive-deps

    const onFinish = useCallback(() => setStatsVersion((version) => version + 1), []);

    const drill = useTypingDrill({target, completeWhen: 'length', onFinish});
    const {phase, typed, inputRef, handleChange, reset, result, flash} = drill;

    const start = useCallback((focusId = focus, count = length) => {
        const weakChars = weakestKeys(6, 5).map((entry) => entry.char);

        writeSetting('focus', focusId);
        writeSetting('length', count);
        setFocus(focusId);
        setTarget(buildDrillText(focusId, count, weakChars));
        setStage('drill');
    }, [focus, length]);

    useEffect(() => {
        if (stage === 'drill' && phase !== 'finished') inputRef.current?.focus();
    }, [stage, phase, target, inputRef]);

    useEffect(() => {
        function handleKey(event) {
            if (stage !== 'drill') return;

            if (event.key === 'Escape') {
                setStage('setup');
            } else if (event.key === 'Enter' && phase === 'finished') {
                if (event.target.closest?.('button, a')) return;

                event.preventDefault();
                start();
            }
        }

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [stage, phase, start]);

    function toggleKeyboard() {
        const next = !showKeyboard;

        setShowKeyboard(next);
        writeSetting('keyboard', next ? 'on' : 'off');
    }

    const focusInfo = FOCUS_OPTIONS.find((option) => option.id === focus);
    const weakDisabled = (id) => id === 'weak' && weak.length === 0;

    const characters = useMemo(
        () => target.split('').map((char, index) => {
            let state = 'kc-ch';

            if (index < typed.length) {
                state += typed[index] === char ? ' is-ok' : ' is-bad';
            } else if (index === typed.length && phase !== 'finished') {
                state += ' is-current';
            }

            return <span key={index} className={state}>{char}</span>;
        }),
        [target, typed, phase],
    );

    return (
        <main className="kc kc--paper kc--practice pr-page">
            <header className="kc-topbar">
                <button
                    type="button"
                    className="kc-btn kc-btn--ghost kc-btn--sm"
                    onClick={() => (stage === 'drill' ? setStage('setup') : navigate('/dashboard'))}
                >
                    ← {stage === 'drill' ? 'Change drill' : 'Dashboard'}
                </button>

                <h1 className="kc-title">Practice</h1>

                <div className="kc-topbar-right">
                    <span className="kc-best">No XP here. Just reps.</span>
                    <button
                        type="button"
                        className="kc-btn kc-btn--ghost kc-btn--sm"
                        aria-pressed={showKeyboard}
                        onClick={toggleKeyboard}
                    >
                        Keyboard {showKeyboard ? 'on' : 'off'}
                    </button>
                </div>
            </header>

            {stage === 'setup' && (
                <section className="pr-setup" aria-label="Choose a drill">
                    <div className="pr-intro">
                        <h2>What do you want to work on?</h2>
                        <p>
                            Pick a set of keys. TypeQuest builds a fresh drill each time and
                            remembers which keys slow you down.
                        </p>
                    </div>

                    <div className="pr-focus-grid" role="radiogroup" aria-label="Focus">
                        {FOCUS_OPTIONS.map((option) => {
                            const disabled = weakDisabled(option.id);
                            const keys = option.id === 'weak'
                                ? weak.map((entry) => entry.char).join(' ')
                                : option.keys;

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={focus === option.id}
                                    className="pr-focus"
                                    disabled={disabled}
                                    onClick={() => setFocus(option.id)}
                                >
                                    <strong>{option.title}</strong>
                                    <span className="pr-focus-keys">
                                        {keys || '—'}
                                    </span>
                                    <small>
                                        {disabled
                                            ? 'Finish a few drills and your trouble keys show up here.'
                                            : option.blurb}
                                    </small>
                                </button>
                            );
                        })}
                    </div>

                    <div className="pr-setup-bar">
                        <div className="kc-segment" role="group" aria-label="Drill length">
                            {LENGTHS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="kc-seg-btn"
                                    aria-pressed={length === item.id}
                                    onClick={() => setLength(item.id)}
                                >
                                    {item.label} <small>{item.note}</small>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="kc-btn kc-btn--primary"
                            onClick={() => start()}
                            disabled={weakDisabled(focus)}
                        >
                            Start drill
                        </button>
                    </div>

                    <div className="pr-history">
                        <span>
                            {keystrokes
                                ? `${keystrokes.toLocaleString()} keystrokes tracked on this device`
                                : 'Nothing tracked yet. Your first drill starts the record.'}
                        </span>
                        {keystrokes > 0 && (
                            <button
                                type="button"
                                className="kc-btn kc-btn--ghost kc-btn--sm"
                                onClick={() => {
                                    clearKeyStats();
                                    if (focus === 'weak') setFocus('home');
                                    setStatsVersion((version) => version + 1);
                                }}
                            >
                                Reset key stats
                            </button>
                        )}
                    </div>
                </section>
            )}

            {stage === 'drill' && (
                <>
                    <section className="kc-console" aria-label="Drill status">
                        <div className="kc-stat">
                            <span className="kc-stat-label">Speed</span>
                            <strong className="kc-stat-value">{drill.liveWpm} <small>WPM</small></strong>
                        </div>
                        <div className="kc-stat">
                            <span className="kc-stat-label">Accuracy</span>
                            <strong className="kc-stat-value">{drill.accuracy}%</strong>
                        </div>
                        <div className="kc-stat">
                            <span className="kc-stat-label">Time</span>
                            <strong className="kc-stat-value">{clock(drill.elapsedMs)}</strong>
                        </div>
                        <div className="kc-stat">
                            <span className="kc-stat-label">Progress</span>
                            <strong className="kc-stat-value">
                                {Math.round((typed.length / Math.max(1, target.length)) * 100)}%
                            </strong>
                            <div className="kc-meter" aria-hidden="true">
                                <div
                                    className="kc-meter-fill"
                                    style={{width: `${(typed.length / Math.max(1, target.length)) * 100}%`}}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="pr-field" aria-label="Typing area">
                        <p className="pr-focus-tag">{focusInfo?.title}</p>

                        <div className="kc-passage-wrap" onClick={() => inputRef.current?.focus()}>
                            <p className="kc-passage" aria-hidden="true">{characters}</p>

                            <textarea
                                ref={inputRef}
                                className="kc-capture"
                                value={typed}
                                onChange={handleChange}
                                onPaste={(event) => event.preventDefault()}
                                onContextMenu={(event) => event.preventDefault()}
                                disabled={phase === 'finished'}
                                spellCheck={false}
                                autoCapitalize="off"
                                autoComplete="off"
                                autoCorrect="off"
                                aria-label="Type the text shown above"
                            />
                        </div>

                        {phase === 'ready' && (
                            <p className="kc-cue">Start typing. The clock begins with your first key.</p>
                        )}

                        {showKeyboard && (
                            <Keyboard
                                next={phase === 'finished' ? '' : target[typed.length] ?? ''}
                                flash={flash}
                            />
                        )}
                    </section>

                    <div className="kc-tools pr-tools">
                        <p className="kc-hint">Esc goes back to the drill list.</p>

                        <div className="kc-tools-actions">
                            <button
                                type="button"
                                className="kc-btn kc-btn--ghost kc-btn--sm"
                                onClick={() => start()}
                            >
                                New text
                            </button>
                            <button
                                type="button"
                                className="kc-btn kc-btn--sm"
                                onClick={reset}
                                disabled={phase === 'ready'}
                            >
                                Restart
                            </button>
                        </div>
                    </div>
                </>
            )}

            {stage === 'drill' && phase === 'finished' && result && (
                <DrillResults
                    result={result}
                    focusTitle={focusInfo?.title}
                    onAgain={() => start()}
                    onWeak={() => start('weak')}
                    onSetup={() => setStage('setup')}
                />
            )}

            <p className="kc-sr" role="status" aria-live="polite">
                {phase === 'finished' && result
                    ? `Finished. ${result.wpm} words per minute, ${result.accuracy} percent accuracy.`
                    : ''}
            </p>
        </main>
    );
}

function DrillResults({result, focusTitle, onAgain, onWeak, onSetup}) {
        const rows = weakestKeys(6, 3)
        .filter((entry) => entry.accuracy < 96 || entry.avgMs > 450)
        .slice(0, 4);
    const hasWeak = weakestKeys(6, 5).length > 0;

    return (
        <div className="kc-overlay" role="dialog" aria-modal="true" aria-labelledby="pr-result-title">
            <div className="kc-card pr-result">
                <h2 id="pr-result-title">
                    {result.accuracy >= 97 ? 'Clean run.' : result.accuracy >= 90 ? 'Nicely done.' : 'Drill complete.'}
                </h2>
                <p className="kc-card-lead">{focusTitle} · {result.seconds}s</p>

                <dl className="pr-numbers">
                    <div><dt>Speed</dt><dd>{result.wpm} <small>WPM</small></dd></div>
                    <div><dt>Accuracy</dt><dd>{result.accuracy}%</dd></div>
                    <div><dt>Mistakes</dt><dd>{result.mistakes}</dd></div>
                </dl>

                {rows.length > 0 && (
                    <div className="pr-trouble">
                        <h3>Keys to watch</h3>
                        <ul>
                            {rows.map((entry) => (
                                <li key={entry.char}>
                                    <span className="kc-key" aria-hidden="true">{entry.char === ' ' ? '␣' : entry.char}</span>
                                    <span>
                                        <strong>{keyName(entry.char)}</strong>
                                        <small>
                                            {entry.accuracy}% right
                                            {entry.avgMs ? ` · ${entry.avgMs} ms per key` : ''}
                                        </small>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {rows.length === 0 && (
                    <p className="kc-card-lead">No trouble keys yet. Every key you pressed was solid.</p>
                )}

                <div className="kc-card-actions">
                    <button type="button" className="kc-btn kc-btn--primary" onClick={onAgain}>
                        Another drill <kbd>Enter</kbd>
                    </button>
                    {hasWeak && (
                        <button type="button" className="kc-btn" onClick={onWeak}>
                            Drill weak keys
                        </button>
                    )}
                    <button type="button" className="kc-btn kc-btn--ghost" onClick={onSetup}>
                        Change focus
                    </button>
                </div>
            </div>
        </div>
    );
}

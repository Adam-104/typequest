import {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, Navigate, useNavigate, useParams} from 'react-router-dom';

import Keyboard from '../components/Keyboard';
import {useAuth} from '../context/AuthContext';
import {useLessonProgress} from '../context/LessonProgressContext';
import useTypingDrill from '../hooks/useTypingDrill';
import {
    generateLessonTarget,
    getFollowingLesson,
    getLesson,
    lessonExercises,
} from '../data/curriculum';
import {FINGER_NAMES, fingerHint, keysInText} from '../utils/keyboardMap';
import {PASS_ACCURACY, starsFor} from '../utils/lessonGrade';
import '../styles/keycap.css';
import '../styles/arcade.css';
import '../styles/passage.css';
import '../styles/practice.css';
import '../styles/learn.css';
import '../styles/paper-play.css';

const DIFFICULTIES = [
    {id: 'beginner', label: 'Gentle', note: 'short'},
    {id: 'intermediate', label: 'Steady', note: 'medium'},
    {id: 'advanced', label: 'Stretch', note: 'long'},
];

function readDifficulty() {
    try {
        const saved = localStorage.getItem('typequest-lesson-difficulty');

        return DIFFICULTIES.some((item) => item.id === saved) ? saved : 'beginner';
    } catch {
        return 'beginner';
    }
}

const clock = (ms) => {
    const total = Math.floor(ms / 1000);

    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export default function LessonPage() {
    const {lessonId} = useParams();
    const lesson = getLesson(lessonId);

    const {isAuthenticated} = useAuth();

    if (!lesson) return <Navigate to="/learn" replace/>;

    // Visitors can try the first level; the rest needs an account.
    if (!isAuthenticated && !lesson.id.startsWith('1-')) {
        return <Navigate to="/register" replace/>;
    }

    // Remount per lesson so state never leaks between lessons.
    return <Lesson key={lesson.id} lesson={lesson}/>;
}

function Lesson({lesson}) {
    const navigate = useNavigate();
    const {saveProgress, getLessonProgress} = useLessonProgress();
    const {isAuthenticated} = useAuth();

    const exercise = lessonExercises[lesson.id] ?? {};
    const fallback = exercise.target ?? 'asdf jkl;';
    const following = getFollowingLesson(lesson.id);
    const previousBest = getLessonProgress(lesson.id);

    const [stage, setStage] = useState('intro'); // intro | drill
    const [difficulty, setDifficulty] = useState(readDifficulty);
    const [target, setTarget] = useState(fallback);
    const [save, setSave] = useState({state: 'idle', message: ''});
    const [showKeyboard, setShowKeyboard] = useState(true);

    const learnedKeys = useMemo(() => keysInText(fallback), [fallback]);

    const persist = useCallback(async (summary) => {
        setSave({state: 'saving', message: ''});

        try {
            await saveProgress(lesson.id, {
                wpm: summary.wpm,
                accuracy: summary.accuracy,
                completed: summary.accuracy >= PASS_ACCURACY,
            });
            setSave({state: 'saved', message: ''});
        } catch (error) {
            setSave({state: 'error', message: error.message || 'Could not save your progress.'});
        }
    }, [lesson.id, saveProgress]);

    const onFinish = useCallback((summary) => {
        if (summary.typedChars === 0) return;

        if (isAuthenticated) persist(summary);
        else setSave({state: 'guest', message: ''});
    }, [persist, isAuthenticated]);

    const drill = useTypingDrill({target, completeWhen: 'length', onFinish});
    const {phase, typed, inputRef, handleChange, reset, result, flash} = drill;

    const start = useCallback((level = difficulty) => {
        try {
            localStorage.setItem('typequest-lesson-difficulty', level);
        } catch {
            // Not remembering the choice is fine.
        }

        setDifficulty(level);
        setTarget(generateLessonTarget(lesson.id, fallback, level));
        setSave({state: 'idle', message: ''});
        setStage('drill');
    }, [difficulty, lesson.id, fallback]);

    useEffect(() => {
        if (stage === 'drill' && phase !== 'finished') inputRef.current?.focus();
    }, [stage, phase, target, inputRef]);

    useEffect(() => {
        function handleKey(event) {
            if (event.key === 'Escape' && stage === 'drill') {
                setStage('intro');
            } else if (event.key === 'Enter' && !event.target.closest?.('button, a')) {
                if (stage === 'intro') {
                    event.preventDefault();
                    start();
                } else if (phase === 'finished' && result) {
                    event.preventDefault();

                    if (result.accuracy >= PASS_ACCURACY && following) {
                        navigate(`/learn/lesson/${following.id}`);
                    } else {
                        start();
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [stage, phase, result, following, navigate, start]);

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

    const nextChar = phase === 'finished' ? '' : target[typed.length] ?? '';
    const hint = phase === 'finished' ? '' : fingerHint(nextChar);

    return (
        <main className="kc kc--paper kc--learn ln-page">
            <header className="kc-topbar">
                <button
                    type="button"
                    className="kc-btn kc-btn--ghost kc-btn--sm"
                    onClick={() => (stage === 'drill' ? setStage('intro') : navigate('/learn'))}
                >
                    ← {stage === 'drill' ? 'Lesson' : 'Learn'}
                </button>

                <h1 className="kc-title">
                    <span className="ln-crumb">Lesson {lesson.id}</span> {lesson.title}
                </h1>

                <div className="kc-topbar-right">
                    {stage === 'drill' && (
                        <button
                            type="button"
                            className="kc-btn kc-btn--ghost kc-btn--sm"
                            aria-pressed={showKeyboard}
                            onClick={() => setShowKeyboard((value) => !value)}
                        >
                            Keyboard {showKeyboard ? 'on' : 'off'}
                        </button>
                    )}
                </div>
            </header>

            {stage === 'intro' && (
                <section className="ln-intro" aria-label="About this lesson">
                    <div className="ln-intro-text">
                        <p className="ln-level">{lesson.levelTitle} · {lesson.duration}</p>
                        <h2>{exercise.heading ?? lesson.title}</h2>
                        <p className="ln-lead">{lesson.description}</p>
                        <p>{exercise.instruction ?? 'Type the text shown. Accuracy matters more than speed.'}</p>

                        {exercise.tip && (
                            <p className="ln-tip">
                                <strong>Tip</strong> {exercise.tip}
                            </p>
                        )}

                        {previousBest.completed && (
                            <p className="ln-best">
                                Your best: {previousBest.bestWpm} WPM at {previousBest.accuracy}% accuracy.
                            </p>
                        )}
                    </div>

                    <div className="ln-intro-side">
                        <h3>Keys in this lesson</h3>
                        <Keyboard lit={learnedKeys} next=""/>

                        <ul className="ln-fingers">
                            {Object.entries(FINGER_NAMES).filter(([id]) => id !== 'th').map(([id, name]) => (
                                <li key={id}><i className="ln-swatch" data-finger={id}/>{name}</li>
                            ))}
                        </ul>

                        <h3>How long?</h3>
                        <div className="kc-segment" role="group" aria-label="Exercise length">
                            {DIFFICULTIES.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="kc-seg-btn"
                                    aria-pressed={difficulty === item.id}
                                    onClick={() => setDifficulty(item.id)}
                                >
                                    {item.label} <small>{item.note}</small>
                                </button>
                            ))}
                        </div>

                        <button type="button" className="kc-btn kc-btn--primary ln-start" onClick={() => start()}>
                            Start lesson <kbd>Enter</kbd>
                        </button>
                    </div>
                </section>
            )}

            {stage === 'drill' && (
                <>
                    <section className="kc-console" aria-label="Lesson status">
                        <div className="kc-stat">
                            <span className="kc-stat-label">Speed</span>
                            <strong className="kc-stat-value">{drill.liveWpm} <small>WPM</small></strong>
                        </div>
                        <div className="kc-stat">
                            <span className="kc-stat-label">Accuracy</span>
                            <strong className="kc-stat-value">{drill.accuracy}%</strong>
                            <span className="kc-stat-note">Aim for {PASS_ACCURACY}%+</span>
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
                                aria-label="Type the lesson text shown above"
                            />
                        </div>

                        <p className="kc-cue ln-hint">
                            {phase === 'ready' ? 'Start typing when you are ready.' : hint || ' '}
                        </p>

                        {showKeyboard && <Keyboard next={nextChar} flash={flash}/>}
                    </section>

                    <div className="kc-tools pr-tools">
                        <p className="kc-hint">Esc returns to the lesson page.</p>

                        <div className="kc-tools-actions">
                            <button type="button" className="kc-btn kc-btn--ghost kc-btn--sm" onClick={() => start()}>
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
                <LessonResults
                    result={result}
                    save={save}
                    following={following}
                    onRetrySave={() => persist(result)}
                    onAgain={() => start()}
                    onNext={() => navigate(`/learn/lesson/${following.id}`)}
                    onPath={() => navigate('/learn')}
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

function LessonResults({result, save, following, onRetrySave, onAgain, onNext, onPath}) {
    const stars = starsFor(result.accuracy);
    const passed = result.accuracy >= PASS_ACCURACY;

    return (
        <div className="kc-overlay" role="dialog" aria-modal="true" aria-labelledby="ln-result-title">
            <div className="kc-card ln-result">
                <div className="ln-stars" role="img" aria-label={`${stars} of 3 stars`}>
                    {[1, 2, 3].map((n) => (
                        <span key={n} className={`kc-key ln-star${n <= stars ? ' is-typed' : ''}`} aria-hidden="true">★</span>
                    ))}
                </div>

                <h2 id="ln-result-title">
                    {passed ? 'Lesson complete.' : 'Almost there.'}
                </h2>
                <p className="kc-card-lead">
                    {passed
                        ? stars === 3 ? 'Three stars. Clean typing.' : 'Aim for 97% accuracy to earn three stars.'
                        : `You need ${PASS_ACCURACY}% accuracy to pass. Slow down and go again.`}
                </p>

                <dl className="pr-numbers">
                    <div><dt>Speed</dt><dd>{result.wpm} <small>WPM</small></dd></div>
                    <div><dt>Accuracy</dt><dd>{result.accuracy}%</dd></div>
                    <div><dt>Mistakes</dt><dd>{result.mistakes}</dd></div>
                </dl>

                <p className="ln-save" data-state={save.state} role="status">
                    {save.state === 'saving' && 'Saving your progress…'}
                    {save.state === 'saved' && 'Progress saved.'}
                    {save.state === 'guest' && (
                        <>
                            Not saved. <Link to="/register">Create a free account</Link> to keep your progress.
                        </>
                    )}
                    {save.state === 'error' && (
                        <>
                            {save.message}{' '}
                            <button type="button" className="kc-btn kc-btn--ghost kc-btn--sm" onClick={onRetrySave}>
                                Try saving again
                            </button>
                        </>
                    )}
                </p>

                <div className="kc-card-actions">
                    {passed && following ? (
                        <button type="button" className="kc-btn kc-btn--primary" onClick={onNext}>
                            Next lesson <kbd>Enter</kbd>
                        </button>
                    ) : (
                        <button type="button" className="kc-btn kc-btn--primary" onClick={onAgain}>
                            {passed ? 'Play again' : 'Try again'} <kbd>Enter</kbd>
                        </button>
                    )}
                    {passed && following && (
                        <button type="button" className="kc-btn" onClick={onAgain}>Improve score</button>
                    )}
                    <button type="button" className="kc-btn kc-btn--ghost" onClick={onPath}>
                        Learning path
                    </button>
                </div>
            </div>
        </div>
    );
}

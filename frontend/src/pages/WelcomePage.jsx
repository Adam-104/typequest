import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import useSound from '../hooks/useSound';
import '../styles/welcome.css';

const SAMPLE = 'The quick brown fox jumps over the lazy dog.';

const TRIES = [
    {
        to: '/games/typing-speed',
        tag: 'Start here',
        title: 'Typing speed test',
        text: 'Find out your words per minute in 30, 60 or 120 seconds.',
        meta: '1 min',
        tint: 'purple',
    },
    {
        to: '/learn/lesson/1-4',
        tag: 'Lesson',
        title: 'Find the home row',
        text: 'The first step of the course: where your fingers rest.',
        meta: '4 min',
        tint: 'cyan',
    },
    {
        to: '/practice',
        tag: 'Practice',
        title: 'Free practice',
        text: 'Drills for the keys you choose, with an on-screen keyboard.',
        meta: 'You choose',
        tint: 'orange',
    },
    {
        to: '/games/typing-racer',
        tag: 'Game',
        title: 'Typing Racer',
        text: 'Race a rival along the rail to the Enter key.',
        meta: '2 min',
        tint: 'blue',
    },
    {
        to: '/games/word-survival',
        tag: 'Game',
        title: 'Word Survival',
        text: 'Clear the words before they cross the page.',
        meta: '1 min',
        tint: 'red',
    },
    {
        to: '/games/space-mission',
        tag: 'Game',
        title: 'Space Mission',
        text: 'Blast the asteroids with the words on them.',
        meta: '1 min',
        tint: 'blue',
    },
    {
        to: '/games/ninja-word-strike',
        tag: 'Game',
        title: 'Ninja Word Strike',
        text: 'Slash words in a chain for a bigger multiplier.',
        meta: '1 min',
        tint: 'orange',
    },
];

const REASONS = [
    ['Keep your scores', 'Every game and lesson is saved, with XP, levels and a history of your speed.'],
    ['Follow the full course', '8 levels and 26 lessons that take you from the home row to confident touch typing.'],
    ['Climb the board', 'Earn achievements and see where you stand on the leaderboard.'],
];

// A one-line taste of typing, right on the page.
function TryLine() {
    const {typeKey} = useSound();
    const [typed, setTyped] = useState('');
    const started = useRef(0);
    const done = typed.length >= SAMPLE.length;

    function change(event) {
        const value = event.target.value.slice(0, SAMPLE.length);

        if (!started.current && value) started.current = performance.now();

        if (value.length > typed.length) {
            const index = value.length - 1;

            typeKey(SAMPLE[index], value[index] === SAMPLE[index]);
        }

        setTyped(value);
    }

    let correct = 0;

    for (let i = 0; i < typed.length; i += 1) if (typed[i] === SAMPLE[i]) correct += 1;

    const minutes = (performance.now() - started.current) / 60000;
    const wpm = done && started.current ? Math.round(correct / 5 / Math.max(minutes, 0.01)) : 0;

    function again() {
        started.current = 0;
        setTyped('');
    }

    return (
        <div className="wl-sheet">
            <label className="wl-sheet-label" htmlFor="wl-line">Type this line. Go on, it's the real thing.</label>

            <p className="wl-line" aria-hidden="true">
                {SAMPLE.split('').map((char, index) => {
                    let state = 'kc-ch';

                    if (index < typed.length) state += typed[index] === char ? ' is-ok' : ' is-bad';
                    else if (index === typed.length) state += ' is-current';

                    return <span key={index} className={state}>{char}</span>;
                })}
            </p>

            <input
                id="wl-line"
                className="wl-input"
                value={typed}
                onChange={change}
                disabled={done}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Start typing here…"
            />

            {done && (
                <p className="wl-result" role="status">
                    <strong>{wpm} WPM</strong> and {Math.round((correct / SAMPLE.length) * 100)}% accurate.{' '}
                    <button type="button" className="wl-link" onClick={again}>Again</button>
                    {' · '}
                    <Link to="/games/typing-speed">Try the full test</Link>
                </p>
            )}
        </div>
    );
}

export default function WelcomePage() {
    return (
        <div className="wl">
            <header className="wl-bar">
                <Link to="/" className="wl-brand" aria-label="TypeQuest home">
                    <span className="wl-stamp">T</span>
                    <span>typequest<i>_</i></span>
                </Link>

                <nav className="wl-bar-actions" aria-label="Account">
                    <Link className="wl-btn wl-btn--quiet" to="/login">Log in</Link>
                    <Link className="wl-btn wl-btn--primary" to="/register">Create account</Link>
                </nav>
            </header>

            <main>
                <section className="wl-hero">
                    <div className="wl-hero-text">
                        <p className="wl-eyebrow">§ learn to type, properly</p>
                        <h1>Type like it matters.<br/><span>Try it before you sign up.</span></h1>
                        <p className="wl-lede">
                            TypeQuest teaches touch typing with short lessons, honest practice and
                            games you will actually want to replay. Everything below works right now,
                            with no account.
                        </p>

                        <div className="wl-cta">
                            <Link className="wl-btn wl-btn--primary wl-btn--big" to="/games/typing-speed">
                                Take the speed test
                            </Link>
                            <a className="wl-btn wl-btn--big" href="#try">See what you can try</a>
                        </div>
                    </div>

                    <TryLine/>
                </section>

                <section id="try" className="wl-section" aria-labelledby="wl-try">
                    <p className="wl-eyebrow">§ no account needed</p>
                    <h2 id="wl-try">Try these first</h2>

                    <ul className="wl-grid">
                        {TRIES.map((item) => (
                            <li key={item.to}>
                                <Link to={item.to} className={`wl-card wl-card--${item.tint}`}>
                                    <span className="wl-card-tag">{item.tag}</span>
                                    <strong>{item.title}</strong>
                                    <span>{item.text}</span>
                                    <span className="wl-card-foot">
                                        <small>{item.meta}</small>
                                        <b>Try it →</b>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="wl-section wl-join" aria-labelledby="wl-join">
                    <div>
                        <p className="wl-eyebrow">§ liked it?</p>
                        <h2 id="wl-join">Then make it a habit.</h2>
                        <p className="wl-lede">A free account keeps everything you do.</p>

                        <div className="wl-cta">
                            <Link className="wl-btn wl-btn--primary wl-btn--big" to="/register">
                                Create a free account
                            </Link>
                            <Link className="wl-btn wl-btn--big" to="/login">I already have one</Link>
                        </div>
                    </div>

                    <ul className="wl-reasons">
                        {REASONS.map(([title, text]) => (
                            <li key={title}>
                                <strong>{title}</strong>
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>

            <footer className="wl-foot">
                <span>© TypeQuest</span>
                <nav aria-label="Legal">
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms">Terms</Link>
                </nav>
            </footer>
        </div>
    );
}

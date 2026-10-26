import {Link} from 'react-router-dom';

import '../styles/Auth.css';

const CONTACT = import.meta.env.VITE_CONTACT_EMAIL || 'contact@your-domain.example';
const UPDATED = 'October 2026';

function Shell({title, children}) {
    return (
        <main className="legal-page">
            <article className="legal-sheet">
                <Link to="/" className="legal-brand">typequest<span>_</span></Link>

                <h1>{title}</h1>
                <p className="legal-updated">Last updated {UPDATED}</p>

                {children}

                <nav className="legal-links" aria-label="Legal pages">
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms">Terms</Link>
                    <Link to="/">Back to TypeQuest</Link>
                </nav>
            </article>
        </main>
    );
}

export function PrivacyPage() {
    return (
        <Shell title="Privacy policy">
            <p>
                TypeQuest is a typing-practice site. This page says what we keep about you and why.
                We keep it short because there is not much to say.
            </p>

            <h2>What we store</h2>
            <ul>
                <li><strong>Account:</strong> your username, email address and a hashed password (we cannot read your password).</li>
                <li><strong>Progress:</strong> your XP and level, game results (speed, accuracy, date), lesson progress and achievements.</li>
                <li><strong>Security:</strong> sign-in sessions, failed-login counts and the IP address used for rate limiting, which is kept only in memory for a few minutes.</li>
                <li><strong>Crash reports:</strong> if the page crashes, the error text and page address are written to our server log. They contain no account details.</li>
            </ul>

            <h2>What stays in your browser</h2>
            <p>
                Your practice key statistics, chosen settings and your current sign-in session are stored in your
                browser’s local storage and session storage. They never leave your device
                (the session token is sent to our server to keep you signed in). We do not use advertising or
                analytics cookies, and we do not track you across other sites.
            </p>

            <h2>Why we use it</h2>
            <p>
                To run your account, show your progress and the public leaderboard, send the emails you ask for
                (email confirmation and password reset), and protect the service from abuse.
            </p>

            <h2>Who can see it</h2>
            <ul>
                <li>Your <strong>username, level and XP</strong> appear on the public leaderboard. Your email never does.</li>
                <li>Our email provider receives your address to deliver those emails, and our hosting provider stores the data on our behalf.</li>
                <li>Site administrators can see accounts and results in order to remove abuse.</li>
                <li>We do not sell your data.</li>
            </ul>

            <h2>Your choices</h2>
            <ul>
                <li>Change your email or password, or <strong>delete your account</strong>, in <Link to="/settings">Settings</Link>. Deleting removes your account and progress. Encrypted backups may keep a copy for up to 30 days before they are overwritten.</li>
                <li>To ask for a copy of your data or have something corrected, write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</li>
            </ul>

            <h2>Children</h2>
            <p>
                If you are under 13 (or under the age your country sets for online accounts), please use TypeQuest
                with a parent’s or teacher’s permission.
            </p>

            <h2>Changes and contact</h2>
            <p>
                If this policy changes we update the date above. Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            </p>
        </Shell>
    );
}

export function TermsPage() {
    return (
        <Shell title="Terms of use">
            <p>By creating an account or using TypeQuest you agree to these terms.</p>

            <h2>Your account</h2>
            <ul>
                <li>Give a real email address you can read, and keep your password private. You are responsible for what happens under your account.</li>
                <li>Choose a username that is not offensive and does not pretend to be someone else.</li>
            </ul>

            <h2>Fair play</h2>
            <ul>
                <li>Do not use scripts, bots or modified clients to submit results, farm XP or reach the leaderboard.</li>
                <li>Do not attack, overload or probe the service, or try to access other people’s accounts.</li>
                <li>We may remove results, hide a player from the leaderboard, or suspend an account that breaks these rules.</li>
            </ul>

            <h2>The service</h2>
            <p>
                TypeQuest is provided “as is”. We try to keep it running and your progress safe, but we cannot
                promise it is always available or free of errors, and we may change or stop features. Scores, levels
                and achievements have no monetary value.
            </p>

            <h2>Ending your account</h2>
            <p>
                You can delete your account at any time in <Link to="/settings">Settings</Link>. We may close accounts
                that break these terms.
            </p>

            <h2>Contact</h2>
            <p>Questions about these terms: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
        </Shell>
    );
}

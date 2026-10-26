import {useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';

import {useAuth} from '../context/AuthContext';
import {accountService} from '../services/accountService';
import '../styles/Auth.css';

// Opened from the link in the confirmation email (works signed out, and on a
// different device from the one that signed up).
export default function VerifyEmailPage() {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const {isAuthenticated} = useAuth();
    const [state, setState] = useState(token
        ? {status: 'working', message: ''}
        : {status: 'error', message: 'This confirmation link is incomplete.'});
    const started = useRef(false);

    useEffect(() => {
        // StrictMode runs effects twice in development; the link works once.
        if (!token || started.current) return;

        started.current = true;

        accountService.verifyEmail(token)
            .then((response) => setState({status: 'done', message: response?.message || 'Your email address is confirmed.'}))
            .catch((error) => setState({status: 'error', message: error.message || 'This link is invalid or has expired.'}));
    }, [token]);

    return (
        <main className="auth-page">
            <section className="auth-card verify-card">
                <Link to="/" className="auth-brand">
                    <span className="auth-logo">T</span>
                    <span>
                        <strong>typequest</strong>
                        <small>learn to type, properly</small>
                    </span>
                </Link>

                <div className="auth-heading">
                    <span className="auth-eyebrow">EMAIL CONFIRMATION</span>
                    <h1>
                        {state.status === 'working' && <>Checking your <span>link…</span></>}
                        {state.status === 'done' && <>All <span>confirmed.</span></>}
                        {state.status === 'error' && <>That link <span>didn’t work.</span></>}
                    </h1>
                    <p role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>
                </div>

                {state.status === 'error' && (
                    <p className="auth-switch">
                        {isAuthenticated
                            ? <>Request a new one in <Link to="/settings">Settings</Link>.</>
                            : <>Sign in and we can send a new link from <Link to="/login">your account</Link>.</>}
                    </p>
                )}

                {state.status !== 'working' && (
                    <Link className="auth-submit verify-continue" to={isAuthenticated ? '/' : '/login'}>
                        {isAuthenticated ? 'Back to TypeQuest →' : 'Go to sign in →'}
                    </Link>
                )}
            </section>
        </main>
    );
}

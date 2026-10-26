import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import '../styles/Auth.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function Login() {
    const navigate = useNavigate();
    const {login} = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    function handleChange(event) {
        const {name, value} = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setResetMessage('');
        setResetError('');
    }

    async function handleForgotPassword() {
        setResetMessage('');
        setResetError('');

        const email = formData.email.trim().toLowerCase();

        if (!email) {
            setResetError('Please enter your registered email address.');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            setResetError('Please enter a valid email address.');
            return;
        }

        try {
            setResetLoading(true);

            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email}),
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    responseText || 'Unable to process your request. Please try again.'
                );
            }

            setResetMessage(
                responseText ||
                'If an account exists with that email, password-reset instructions will be sent.'
            );
        } catch (err) {
            setResetError(
                err.message || 'Unable to contact the server. Please try again.'
            );
        } finally {
            setResetLoading(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (!formData.email.trim() || !formData.password) {
            setError('Please enter your email and password.');
            return;
        }

        try {
            setLoading(true);
            await login(formData);
            navigate('/', {replace: true});
        } catch (err) {
            setError(err.message || 'Unable to log in. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <Link to="/login" className="auth-brand">
                    <span className="auth-logo">T</span>
                    <span>
                        <strong>typequest</strong>
                        <small>learn to type, properly</small>
                    </span>
                </Link>

                <div className="auth-heading">
                    <span className="auth-eyebrow">WELCOME BACK, PLAYER</span>
                    <h1>Ready to <span>level up?</span></h1>
                    <p>Sign in and continue your typing adventure.</p>
                </div>

                {error && (
                    <div className="auth-error" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <div className="auth-field-heading">
                            <label htmlFor="password">Password</label>
                            <button
                                type="button"
                                className="auth-forgot-password"
                                onClick={handleForgotPassword}
                                disabled={resetLoading}
                            >
                                {resetLoading ? 'Sending...' : 'Forgot password?'}
                            </button>
                        </div>

                        <div className="auth-password-wrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="auth-toggle-password"
                                onClick={() => setShowPassword((previous) => !previous)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    {resetError && (
                        <div className="auth-error" role="alert">
                            {resetError}
                        </div>
                    )}

                    {resetMessage && (
                        <div className="auth-success" role="status">
                            {resetMessage}
                        </div>
                    )}

                    <div className="auth-form-options">
                        <span>Secure sign-in</span>
                        <span>Passwords are stored hashed</span>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing you in...' : 'Sign In →'}
                    </button>
                </form>

                <p className="auth-switch">
                    New to TypeQuest? <Link to="/register">Create an account</Link>
                    <br/>Just looking? <Link to="/">Try it first</Link>
                </p>

                <p className="legal-inline">
                    <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
                </p>

                <div className="auth-footer">
                    Your next personal best starts here.
                </div>
            </section>

            <aside className="auth-decoration" aria-label="Typing motivation">
                <div className="auth-orbit orbit-one"/>
                <div className="auth-orbit orbit-two"/>

                <div className="auth-floating-key key-one">W</div>
                <div className="auth-floating-key key-two">A</div>
                <div className="auth-floating-key key-three">S</div>
                <div className="auth-floating-key key-four">D</div>

                <div className="auth-decoration-content">
                    <span className="auth-eyebrow">EVERY KEYSTROKE COUNTS</span>
                    <h2>Find your flow.<br/>Beat your <span>best.</span></h2>
                    <p>
                        Practice with purpose, build your speed, and make every
                        keystroke count.
                    </p>

                    <div className="auth-mini-stats">
                        <div>
                            <strong>01</strong>
                            <span>FOCUS</span>
                        </div>
                        <div>
                            <strong>02</strong>
                            <span>PRACTICE</span>
                        </div>
                        <div>
                            <strong>03</strong>
                            <span>LEVEL UP</span>
                        </div>
                    </div>
                </div>
            </aside>
        </main>
    );
}
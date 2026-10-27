import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import useSlowHint from '../hooks/useSlowHint';
import '../styles/Auth.css';

export default function Register() {
    const navigate = useNavigate();
    const {register} = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const slow = useSlowHint(loading);

    function handleChange(event) {
        const {name, value} = event.target;


        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));


    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setSuccess('');


        if (!formData.username.trim() || !formData.email.trim()) {
            setError('Please complete all required fields.');
            return;
        }

        if (formData.password.length < 12) {
            setError('Your password must contain at least 12 characters.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Your passwords do not match.');
            return;
        }

        try {
            setLoading(true);

            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });

            setSuccess('Account created! We emailed you a link to confirm your address. Redirecting to sign in...');

            window.setTimeout(() => {
                navigate('/login', {replace: true});
            }, 1200);
        } catch (err) {
            setError(err.message || 'Unable to create your account. Please try again.');
        } finally {
            setLoading(false);
        }


    }

    return (<main className="auth-page">
            <section className="auth-card"><Link to="/login" className="auth-brand"> <span
                className="auth-logo">T</span>
                <span> <strong>typequest</strong> <small>learn to type, properly</small> </span> </Link>


                <div className="auth-heading">
                    <span className="auth-eyebrow">YOUR JOURNEY STARTS HERE</span>
                    <h1>Create your <span>account.</span></h1>
                    <p>Join TypeQuest and turn every keystroke into progress.</p>
                </div>

                {slow && (
                    <div className="auth-notice" role="status">
                        Waking the server up. The free host sleeps when idle, so the first
                        request can take up to a minute. Please keep this page open.
                    </div>
                )}

                {error && (
                    <div className="auth-error" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="auth-success" role="status">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Choose your player name"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"
                            maxLength={50}
                            required
                        />
                    </div>

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
                        <label htmlFor="password">Password</label>

                        <div className="auth-password-wrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="At least 12 characters"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                minLength={12}
                                maxLength={72}
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

                    <div className="auth-field">
                        <label htmlFor="confirmPassword">Confirm password</label>

                        <div className="auth-password-wrapper">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Enter your password again"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                minLength={12}
                                maxLength={72}
                                required
                            />

                            <button
                                type="button"
                                className="auth-toggle-password"
                                onClick={() =>
                                    setShowConfirmPassword((previous) => !previous)
                                }
                                aria-label={
                                    showConfirmPassword ? 'Hide password' : 'Show password'
                                }
                            >
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating your account...' : 'Create Account →'}
                    </button>
                </form>

                <p className="legal-inline">
                    By creating an account you agree to the <Link to="/terms">terms</Link> and
                    the <Link to="/privacy">privacy policy</Link>.
                </p>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                    <br/>Just looking? <Link to="/">Try it first</Link>
                </p>

                <div className="auth-footer">
                    Your next personal best starts here.
                </div>
            </section>

            <aside className="auth-decoration">
                <div className="auth-orbit orbit-one"/>
                <div className="auth-orbit orbit-two"/>

                <div className="auth-floating-key key-one">T</div>
                <div className="auth-floating-key key-two">Y</div>
                <div className="auth-floating-key key-three">P</div>
                <div className="auth-floating-key key-four">Q</div>

                <div className="auth-decoration-content">
                    <span className="auth-eyebrow">START YOUR NEXT CHAPTER</span>
                    <h2>Small steps.<br/>Big <span>progress.</span></h2>

                    <p>
                        Build consistency, sharpen your accuracy, and discover how far
                        your typing skills can take you.
                    </p>

                    <div className="auth-mini-stats">
                        <div>
                            <strong>01</strong>
                            <span>CREATE</span>
                        </div>
                        <div>
                            <strong>02</strong>
                            <span>IMPROVE</span>
                        </div>
                        <div>
                            <strong>03</strong>
                            <span>ACHIEVE</span>
                        </div>
                    </div>
                </div>
            </aside>
        </main>


    );
}

import {useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import '../styles/Auth.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        const {name, value} = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError('');
        setSuccess('');
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!token) {
            setError('Your reset link is missing its token. Please request a new password-reset email.');
            return;
        }

        if (formData.newPassword.length < 12 || formData.newPassword.length > 72) {
            setError('Your password must contain between 12 and 72 characters.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Your passwords do not match.');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword,
                }),
            });

            const responseText = await response.text();
            let responseMessage = responseText;

            try {
                const responseData = JSON.parse(responseText);
                responseMessage =
                    responseData.message ||
                    responseData.error ||
                    responseData.detail ||
                    responseText;
            } catch {
                responseMessage = responseText;
            }

            if (!response.ok) {
                throw new Error(
                    responseMessage ||
                    'Your reset link is invalid or expired. Please request a new one.'
                );
            }

            setSuccess(
                responseMessage ||
                'Your password has been reset successfully. You can now log in.'
            );

            setFormData({
                newPassword: '',
                confirmPassword: '',
            });
        } catch (err) {
            setError(
                err.message ||
                'Unable to reset your password. Please try again.'
            );
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
                    <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
                    <h1>Create a <span>new password.</span></h1>
                    <p>Choose a strong password to secure your TypeQuest account.</p>
                </div>

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

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label htmlFor="newPassword">New password</label>

                            <div className="auth-password-wrapper">
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="At least 12 characters"
                                    value={formData.newPassword}
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
                            <label htmlFor="confirmPassword">Confirm new password</label>

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
                                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="auth-form-options">
                            <span>12–72 characters</span>
                            <span>Secure password reset</span>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? 'Resetting password...' : 'Reset Password →'}
                        </button>
                    </form>
                )}

                {success ? (
                    <button
                        type="button"
                        className="auth-submit"
                        onClick={() => navigate('/login', {replace: true})}
                    >
                        Return to Sign In →
                    </button>
                ) : (
                    <p className="auth-switch">
                        Remember your password? <Link to="/login">Sign in</Link>
                    </p>
                )}

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
                    <span className="auth-eyebrow">A FRESH START</span>
                    <h2>Secure your account.<br/>Keep <span>leveling up.</span></h2>
                    <p>
                        A strong password helps protect your account and keeps your
                        typing journey moving forward.
                    </p>

                    <div className="auth-mini-stats">
                        <div>
                            <strong>01</strong>
                            <span>SECURE</span>
                        </div>
                        <div>
                            <strong>02</strong>
                            <span>RESET</span>
                        </div>
                        <div>
                            <strong>03</strong>
                            <span>CONTINUE</span>
                        </div>
                    </div>
                </div>
            </aside>
        </main>
    );
}

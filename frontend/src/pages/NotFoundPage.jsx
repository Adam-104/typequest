import {Link} from 'react-router-dom';

import {useAuth} from '../context/AuthContext';
import '../styles/Auth.css';

// Shown for any address that does not exist. It used to redirect silently to
// the home page, which hid mistyped links from the player.
export default function NotFoundPage() {
    const {isAuthenticated} = useAuth();

    return (
        <main className="notfound-page">
            <section className="notfound-card">
                <Link to="/" className="auth-brand">
                    <span className="auth-logo">T</span>
                    <span>
                        <strong>typequest</strong>
                        <small>learn to type, properly</small>
                    </span>
                </Link>

                <p className="notfound-code" aria-hidden="true">404</p>
                <h1>This page is off the keyboard.</h1>
                <p>
                    We could not find what you were looking for. The link may be mistyped, or the page may have moved.
                </p>

                <div className="notfound-actions">
                    <Link className="primary-button" to="/">
                        {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
                    </Link>

                    {isAuthenticated && (
                        <Link className="primary-button" to="/learn">Continue learning</Link>
                    )}
                </div>
            </section>
        </main>
    );
}

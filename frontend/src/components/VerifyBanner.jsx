import {useState} from 'react';
import {Link} from 'react-router-dom';

import {useAuth} from '../context/AuthContext';
import {usePlayer} from '../context/PlayerContext';
import {accountService} from '../services/accountService';

// A slim notice under the page header while the email is unconfirmed.
// Nothing is blocked: it only nudges, and confirming is one click away.
export default function VerifyBanner() {
    const {authRequest} = useAuth();
    const {profile} = usePlayer();
    const [state, setState] = useState({status: 'idle', message: ''});

    if (!profile || profile.emailVerified !== false) return null;

    async function resend() {
        setState({status: 'sending', message: ''});

        try {
            await accountService.resendVerification(authRequest);
            setState({status: 'sent', message: 'Sent. Check your inbox (and spam folder).'});
        } catch (error) {
            setState({status: 'error', message: error.message || 'Could not send the email.'});
        }
    }

    return (
        <div className="verify-banner" role="status">
            <span>
                <strong>Confirm your email.</strong>{' '}
                We sent a link to {profile.email}. Without it you cannot reset a forgotten password.
            </span>

            <span className="verify-banner-actions">
                {state.message
                    ? <span data-status={state.status}>{state.message}</span>
                    : (
                        <button type="button" onClick={resend} disabled={state.status === 'sending'}>
                            {state.status === 'sending' ? 'Sending…' : 'Resend email'}
                        </button>
                    )}
                <Link to="/settings">Wrong address?</Link>
            </span>
        </div>
    );
}

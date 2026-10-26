import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import PageHeader from '../components/PageHeader';
import {useAuth} from '../context/AuthContext';
import {usePlayer} from '../context/PlayerContext';
import useSound from '../hooks/useSound';
import useTheme from '../hooks/useTheme';
import {accountService} from '../services/accountService';
import '../styles/Pages.css';
import '../styles/admin.css';

const emptyResult = {kind: '', text: ''};

function Notice({result}) {
    if (!result.text) return null;

    return (
        <p className="settings-notice" data-kind={result.kind} role={result.kind === 'error' ? 'alert' : 'status'}>
            {result.text}
        </p>
    );
}

export default function SettingsPage() {
    const {profile, reload} = usePlayer();
    const {user} = useAuth();

    return (
        <main className="dashboard">
            <PageHeader section="Settings"/>

            <section className="welcome-section">
                <div>
                    <div className="eyebrow">Your account</div>
                    <h1>Settings.</h1>
                    <p>
                        Signed in as <strong>{profile?.username ?? user?.username}</strong>.
                        Your details are used only to run your TypeQuest account;
                        see the <Link to="/privacy">privacy policy</Link>.
                    </p>
                </div>
            </section>

            <AppearanceSection/>
            <SoundSection/>
            <EmailSection profile={profile} onChanged={reload}/>
            <PasswordSection/>
            <DeleteSection/>
        </main>
    );
}

const THEME_CHOICES = [
    {id: 'light', label: 'Light', note: 'Cream paper, dark ink'},
    {id: 'dark', label: 'Dark', note: 'The same sheet at night'},
    {id: 'system', label: 'System default', note: 'Follows your device'},
];

function AppearanceSection() {
    const {preference, resolved, setPreference} = useTheme();

    return (
        <section className="page-card settings-card" aria-labelledby="st-appearance">
            <h2 id="st-appearance">Appearance</h2>

            <div className="theme-choices" role="radiogroup" aria-labelledby="st-appearance">
                {THEME_CHOICES.map((choice) => (
                    <button
                        key={choice.id}
                        type="button"
                        role="radio"
                        aria-checked={preference === choice.id}
                        className="theme-choice"
                        onClick={() => setPreference(choice.id)}
                    >
                        <span className={`theme-swatch theme-swatch--${choice.id}`} aria-hidden="true">
                            <i/><i/><i/>
                        </span>
                        <strong>{choice.label}</strong>
                        <small>{choice.note}</small>
                    </button>
                ))}
            </div>

            <p className="settings-hint">
                {preference === 'system'
                    ? `Your device is using the ${resolved} theme right now, so TypeQuest is too.`
                    : `TypeQuest will stay ${preference} on this device.`}
            </p>
        </section>
    );
}

function SoundSection() {
    const sound = useSound();
    const samples = [
        ['key', 'Key'],
        ['error', 'Typo'],
        ['hit', 'Word cleared'],
        ['laser', 'Laser'],
        ['slash', 'Slash'],
        ['thud', 'Miss'],
        ['win', 'Win'],
    ];

    return (
        <section className="page-card settings-card" aria-labelledby="st-sound">
            <h2 id="st-sound">Sound</h2>

            <div className="settings-switches">
                <label className="settings-switch">
                    <input
                        type="checkbox"
                        checked={sound.enabled}
                        onChange={(event) => sound.setEnabled(event.target.checked)}
                    />
                    <span>
                        <strong>Sound effects</strong>
                        <small>Games, Practice and lessons</small>
                    </span>
                </label>

                <label className="settings-switch">
                    <input
                        type="checkbox"
                        checked={sound.typing}
                        disabled={!sound.enabled}
                        onChange={(event) => sound.setTyping(event.target.checked)}
                    />
                    <span>
                        <strong>Typewriter key sounds</strong>
                        <small>A clack for every key you press</small>
                    </span>
                </label>
            </div>

            <label className="settings-volume">
                <span>Volume <b>{Math.round(sound.volume * 100)}%</b></span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={Math.round(sound.volume * 100)}
                    disabled={!sound.enabled}
                    onChange={(event) => sound.setVolume(Number(event.target.value) / 100)}
                    onPointerUp={() => sound.play('hit')}
                    onKeyUp={() => sound.play('hit')}
                />
            </label>

            <div className="settings-samples" role="group" aria-label="Preview sounds">
                {samples.map(([name, label]) => (
                    <button
                        key={name}
                        type="button"
                        className="settings-sample"
                        disabled={!sound.enabled}
                        onClick={() => sound.play(name)}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </section>
    );
}

function EmailSection({profile, onChanged}) {
    const {authRequest} = useAuth();
    const [form, setForm] = useState({newEmail: '', currentPassword: ''});
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(emptyResult);
    const [resent, setResent] = useState(emptyResult);

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setResult(emptyResult);

        try {
            const response = await accountService.changeEmail(authRequest, form);

            setResult({kind: 'ok', text: response?.message || 'Check the new address for a confirmation link.'});
            setForm({newEmail: '', currentPassword: ''});
            onChanged?.();
        } catch (error) {
            setResult({kind: 'error', text: error.message || 'Could not change the email.'});
        } finally {
            setBusy(false);
        }
    }

    async function resend() {
        setResent(emptyResult);

        try {
            await accountService.resendVerification(authRequest);
            setResent({kind: 'ok', text: 'Confirmation email sent.'});
        } catch (error) {
            setResent({kind: 'error', text: error.message || 'Could not send the email.'});
        }
    }

    return (
        <section className="page-card settings-card" aria-labelledby="st-email">
            <h2 id="st-email">Email address</h2>

            <p className="settings-current">
                <span>{profile?.email ?? '—'}</span>
                {profile && (
                    <b className="settings-tag" data-ok={profile.emailVerified}>
                        {profile.emailVerified ? 'confirmed' : 'not confirmed'}
                    </b>
                )}
            </p>

            {profile && !profile.emailVerified && (
                <p className="settings-hint">
                    Confirm it so you can recover your account if you forget your password.{' '}
                    <button type="button" className="settings-link" onClick={resend}>Resend the email</button>
                </p>
            )}
            <Notice result={resent}/>

            <form className="admin-form settings-form" onSubmit={submit}>
                <label>
                    <span>New email address</span>
                    <input
                        type="email"
                        value={form.newEmail}
                        onChange={(event) => setForm({...form, newEmail: event.target.value})}
                        autoComplete="email"
                        maxLength={150}
                        required
                    />
                </label>

                <label>
                    <span>Current password</span>
                    <input
                        type="password"
                        value={form.currentPassword}
                        onChange={(event) => setForm({...form, currentPassword: event.target.value})}
                        autoComplete="current-password"
                        maxLength={72}
                        required
                    />
                </label>

                <button type="submit" className="admin-primary" disabled={busy}>
                    {busy ? 'Sending…' : 'Change email'}
                </button>

                <p className="settings-hint">
                    Your email changes only after you click the link we send to the new address.
                </p>
                <Notice result={result}/>
            </form>
        </section>
    );
}

function PasswordSection() {
    const {authRequest, getRefreshToken} = useAuth();
    const [form, setForm] = useState({currentPassword: '', newPassword: '', confirm: ''});
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(emptyResult);

    async function submit(event) {
        event.preventDefault();
        setResult(emptyResult);

        if (form.newPassword.length < 12 || form.newPassword.length > 72) {
            setResult({kind: 'error', text: 'Your new password must contain between 12 and 72 characters.'});
            return;
        }

        if (form.newPassword !== form.confirm) {
            setResult({kind: 'error', text: 'The new passwords do not match.'});
            return;
        }

        setBusy(true);

        try {
            const response = await accountService.changePassword(authRequest, {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
                refreshToken: getRefreshToken(),
            });

            setResult({kind: 'ok', text: response?.message || 'Password changed.'});
            setForm({currentPassword: '', newPassword: '', confirm: ''});
        } catch (error) {
            setResult({kind: 'error', text: error.message || 'Could not change the password.'});
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="page-card settings-card" aria-labelledby="st-password">
            <h2 id="st-password">Password</h2>

            <form className="admin-form settings-form" onSubmit={submit}>
                <label>
                    <span>Current password</span>
                    <input
                        type="password"
                        value={form.currentPassword}
                        onChange={(event) => setForm({...form, currentPassword: event.target.value})}
                        autoComplete="current-password"
                        maxLength={72}
                        required
                    />
                </label>

                <label>
                    <span>New password (12–72 characters)</span>
                    <input
                        type="password"
                        value={form.newPassword}
                        onChange={(event) => setForm({...form, newPassword: event.target.value})}
                        autoComplete="new-password"
                        minLength={12}
                        maxLength={72}
                        required
                    />
                </label>

                <label>
                    <span>Repeat the new password</span>
                    <input
                        type="password"
                        value={form.confirm}
                        onChange={(event) => setForm({...form, confirm: event.target.value})}
                        autoComplete="new-password"
                        maxLength={72}
                        required
                    />
                </label>

                <button type="submit" className="admin-primary" disabled={busy}>
                    {busy ? 'Saving…' : 'Change password'}
                </button>

                <p className="settings-hint">This device stays signed in; all your other devices are signed out.</p>
                <Notice result={result}/>
            </form>
        </section>
    );
}

function DeleteSection() {
    const navigate = useNavigate();
    const {authRequest, endSession} = useAuth();
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [typed, setTyped] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(emptyResult);

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setResult(emptyResult);

        try {
            await accountService.deleteAccount(authRequest, {password});
            endSession();
            navigate('/login', {replace: true});
        } catch (error) {
            setResult({kind: 'error', text: error.message || 'Could not delete the account.'});
            setBusy(false);
        }
    }

    return (
        <section className="page-card settings-card settings-danger" aria-labelledby="st-delete">
            <h2 id="st-delete">Delete account</h2>

            <p className="settings-hint">
                This permanently removes your account, XP, game history, lesson progress and
                achievements. It cannot be undone.
            </p>

            {!open ? (
                <div className="admin-actions">
                    <button type="button" className="is-danger" onClick={() => setOpen(true)}>
                        Delete my account…
                    </button>
                </div>
            ) : (
                <form className="admin-form settings-form" onSubmit={submit}>
                    <label>
                        <span>Your password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            maxLength={72}
                            required
                        />
                    </label>

                    <label>
                        <span>Type DELETE to confirm</span>
                        <input
                            value={typed}
                            onChange={(event) => setTyped(event.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                            required
                        />
                    </label>

                    <div className="admin-actions">
                        <button type="submit" className="is-danger" disabled={busy || typed !== 'DELETE'}>
                            {busy ? 'Deleting…' : 'Delete everything'}
                        </button>
                        <button type="button" onClick={() => { setOpen(false); setPassword(''); setTyped(''); }}>
                            Cancel
                        </button>
                    </div>

                    <Notice result={result}/>
                </form>
            )}
        </section>
    );
}

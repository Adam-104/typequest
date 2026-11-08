import {PASSWORD_MAX_BYTES, PASSWORD_MIN, passwordBytes, passwordStrength} from '../utils/password';

// Live guidance under a "new password" field: a four-step meter and the rules.
export default function PasswordHint({password}) {
    if (!password) {
        return (
            <p className="pw-hint-empty">
                Use {PASSWORD_MIN} or more characters. A few random words in a row works well.
            </p>
        );
    }

    const {score, label} = passwordStrength(password);
    const longEnough = password.length >= PASSWORD_MIN;
    const tooLong = passwordBytes(password) > PASSWORD_MAX_BYTES;

    return (
        <div className="pw-hint">
            <div className="pw-meter" data-score={score} aria-hidden="true">
                <span/>
                <span/>
                <span/>
                <span/>
            </div>

            <p className="pw-label" aria-live="polite">
                Strength: <strong>{label}</strong>
            </p>

            <ul className="pw-rules">
                <li className={longEnough ? 'is-met' : ''}>
                    <span aria-hidden="true">{longEnough ? '✓' : '○'}</span>
                    At least {PASSWORD_MIN} characters ({password.length} so far)
                </li>
                <li className={tooLong ? 'is-bad' : 'is-met'}>
                    <span aria-hidden="true">{tooLong ? '✕' : '✓'}</span>
                    {tooLong ? `Too long: ${PASSWORD_MAX_BYTES} bytes at most` : `Not too long (${PASSWORD_MAX_BYTES} bytes at most)`}
                </li>
            </ul>
        </div>
    );
}

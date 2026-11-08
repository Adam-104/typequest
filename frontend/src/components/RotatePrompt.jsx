import {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {SHOW_ROTATE_EVENT, canRotateForUser, isSmallTouchScreen, rotateToLandscape} from '../utils/orientation';

const DISMISS_KEY = 'typequest_rotate_dismissed';

// Screens where the player types for real.
const TYPING_ROUTE = /^\/(practice|learn\/lesson\/[^/]+|games\/[^/]+)\/?$/;

function readFlag() {
    try {
        return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
        return false;
    }
}

function saveFlag() {
    try {
        sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
        // Private mode: the card just comes back on the next page.
    }
}

// A hardware keyboard sends real key codes; phone soft keyboards usually send
// "Unidentified" or keyCode 229. Only a hint, so it only ever HIDES the card.
function looksLikeHardwareKey(event) {
    return Boolean(event.code) && event.key !== 'Unidentified' && event.keyCode !== 229;
}

// Asks small portrait screens to rotate before typing. Never blocks: "Continue anyway" always works.
export default function RotatePrompt() {
    const {pathname} = useLocation();
    const [portrait, setPortrait] = useState(false);
    const [dismissed, setDismissed] = useState(readFlag);
    const [small] = useState(isSmallTouchScreen);
    const [reopened, setReopened] = useState(false);

    useEffect(() => {
        if (!small) return undefined;
        const query = window.matchMedia('(orientation: portrait)');
        const update = () => setPortrait(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, [small]);

    useEffect(() => {
        if (!small || dismissed) return undefined;
        const onKey = (event) => {
            if (looksLikeHardwareKey(event)) {
                saveFlag();
                setDismissed(true);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [small, dismissed]);

    // The Rotate button in the top bar asks for the card again, even after "Stay in portrait".
    useEffect(() => {
        if (!small) return undefined;

        const open = () => setReopened(true);

        window.addEventListener(SHOW_ROTATE_EVENT, open);

        return () => window.removeEventListener(SHOW_ROTATE_EVENT, open);
    }, [small]);

    // The phone's own keyboard opening shrinks the visible height a lot: that player is
    // typing on the screen, so portrait is the right choice and we stop asking.
    useEffect(() => {
        if (!small || dismissed || !window.visualViewport) return undefined;
        const viewport = window.visualViewport;
        const onResize = () => {
            if (window.innerHeight - viewport.height > 150) {
                saveFlag();
                setDismissed(true);
            }
        };
        viewport.addEventListener('resize', onResize);
        return () => viewport.removeEventListener('resize', onResize);
    }, [small, dismissed]);

    const visible = reopened || !dismissed;

    if (!small || !visible || !portrait || !TYPING_ROUTE.test(pathname)) return null;

    const dismiss = () => {
        saveFlag();
        setDismissed(true);
        setReopened(false);
    };

    const rotateForMe = async () => {
        if (await rotateToLandscape()) dismiss();
    };

    return (
        <div className="rotate-backdrop" role="dialog" aria-modal="true" aria-labelledby="rotate-title">
            <div className="rotate-card">
                <div className="rotate-phone" aria-hidden="true">
                    <svg viewBox="0 0 120 90" width="120" height="90">
                        <g className="rotate-device">
                            <rect x="44" y="12" width="32" height="62" rx="6" fill="none" stroke="currentColor" strokeWidth="3"/>
                            <line x1="55" y1="67" x2="65" y2="67" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </g>
                        <path d="M92 20 a26 26 0 0 1 8 22" fill="none" stroke="var(--primary, #b5301f)" strokeWidth="3" strokeLinecap="round"/>
                        <path d="M101 34 l-1 9 l-8 -4" fill="none" stroke="var(--primary, #b5301f)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <h2 id="rotate-title">Using an external keyboard? Rotate your phone</h2>
                <p>With an external keyboard connected, landscape gives you a wider text area and a bigger on-screen key guide.</p>
                <p className="rotate-note">Typing on the phone's own keyboard? Stay in portrait. For real touch typing, connect an external keyboard (Bluetooth, USB or wireless).</p>
                {canRotateForUser() && (
                    <button type="button" className="rotate-now" onClick={rotateForMe}>Rotate for me</button>
                )}
                <button type="button" className="rotate-continue" onClick={dismiss}>Stay in portrait</button>
            </div>
        </div>
    );
}

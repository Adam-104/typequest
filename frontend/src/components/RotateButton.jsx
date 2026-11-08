import {useEffect, useState} from 'react';
import {
    SHOW_ROTATE_EVENT,
    isInFullscreen,
    isSmallTouchScreen,
    leaveLandscape,
    rotateToLandscape,
} from '../utils/orientation';

// A small button in the top bar of every typing screen (lessons, Practice, games).
// Portrait: "Rotate" turns the screen to landscape where the browser allows it, and
// otherwise opens the rotate card with instructions. After it rotated the screen for the
// player it becomes "Exit" so they can go back.
export default function RotateButton() {
    const [small] = useState(isSmallTouchScreen);
    const [portrait, setPortrait] = useState(false);
    const [fullscreen, setFullscreen] = useState(isInFullscreen);

    useEffect(() => {
        if (!small) return undefined;

        const query = window.matchMedia('(orientation: portrait)');
        const update = () => setPortrait(query.matches);
        const onFullscreen = () => setFullscreen(isInFullscreen());

        update();
        query.addEventListener('change', update);
        document.addEventListener('fullscreenchange', onFullscreen);

        return () => {
            query.removeEventListener('change', update);
            document.removeEventListener('fullscreenchange', onFullscreen);
        };
    }, [small]);

    if (!small) return null;

    if (!portrait && !fullscreen) return null;

    if (fullscreen && !portrait) {
        return (
            <button type="button" className="kc-btn kc-btn--ghost kc-btn--sm rotate-btn" onClick={leaveLandscape}>
                ↩ Exit landscape
            </button>
        );
    }

    const rotate = async () => {
        const done = await rotateToLandscape();

        if (!done) {
            window.dispatchEvent(new Event(SHOW_ROTATE_EVENT));
        }
    };

    return (
        <button
            type="button"
            className="kc-btn kc-btn--ghost kc-btn--sm rotate-btn"
            onClick={rotate}
            aria-label="Rotate your phone to landscape for more room"
        >
            ↻ Rotate
        </button>
    );
}

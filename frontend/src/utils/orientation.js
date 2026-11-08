// Helpers for "rotate your phone" on typing screens.

// Raised when something asks the rotate card to open again (the Rotate button).
export const SHOW_ROTATE_EVENT = 'typequest:show-rotate';

// Phones and small tablets: any touch screen that is small, either by its real size
// (short side under 820 px) or by the page width the browser reports (under 1025 px,
// which also covers Chrome's "Desktop site" mode on a phone).
export function isSmallTouchScreen() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;

    // Main input must be touch: laptops with a touch screen (mouse/trackpad first) are left alone.
    const touch = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;
    if (!touch) return false;

    const shortSide = Math.min(window.screen.width, window.screen.height);

    return shortSide <= 820 || window.innerWidth <= 1024;
}

// Browsers may only lock the orientation of a page that is full screen, and only some
// support it (Chrome on Android does; Safari on iPhone does not).
export function canRotateForUser() {
    return typeof document !== 'undefined'
        && Boolean(window.screen?.orientation?.lock)
        && Boolean(document.documentElement.requestFullscreen);
}

export function isInFullscreen() {
    return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
}

// Must be called from a tap. Returns true when the screen was switched to landscape.
export async function rotateToLandscape() {
    if (!canRotateForUser()) return false;

    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        }

        await window.screen.orientation.lock('landscape');

        return true;
    } catch {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
        } catch {
            // Nothing more to undo.
        }

        return false;
    }
}

export async function leaveLandscape() {
    try {
        window.screen.orientation?.unlock?.();

        if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
        // The browser already left full screen.
    }
}

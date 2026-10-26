// Sends browser crashes to the server log (POST /api/client-errors) so they
// show up next to backend errors. No third-party service, no tracking: only
// the error text, the page address and where it came from.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const MAX_REPORTS_PER_PAGE_LOAD = 5;

let sent = 0;
const seen = new Set();

export function reportError(error, source = 'window') {
    try {
        if (sent >= MAX_REPORTS_PER_PAGE_LOAD) return;

        const message = String(error?.message ?? error ?? 'Unknown error').slice(0, 500);
        const stack = String(error?.stack ?? '').slice(0, 4000);
        const key = message + stack.slice(0, 200);

        // The same crash in a render loop is reported once.
        if (seen.has(key)) return;

        seen.add(key);
        sent += 1;

        fetch(`${API_BASE_URL}/api/client-errors`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                message,
                stack,
                url: window.location.pathname.slice(0, 300),
                source: source.slice(0, 40),
            }),
            keepalive: true,
        }).catch(() => {
            // Reporting must never cause another error.
        });
    } catch {
        // Same.
    }
}

export function installErrorReporting() {
    window.addEventListener('error', (event) => {
        reportError(event.error ?? event.message, 'window');
    });

    window.addEventListener('unhandledrejection', (event) => {
        reportError(event.reason, 'promise');
    });
}

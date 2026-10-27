// Free hosts put the API to sleep when nobody is using it, and waking it takes
// up to a minute. Asking it for its health page as soon as the site opens lets
// it wake while the visitor is still reading the page.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function wakeServer() {
    try {
        // no-cors: we do not need the answer, only to knock on the door.
        fetch(`${API_BASE_URL}/actuator/health`, {mode: 'no-cors', cache: 'no-store'}).catch(() => {});
    } catch {
        // Nothing to do if the browser refuses.
    }
}

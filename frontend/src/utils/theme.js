// Light / dark / system theme. The choice is saved in localStorage and
// applied as data-theme="light|dark" on <html>; index.css holds both palettes.
// index.html applies it once before the first paint, so there is no flash.

const KEY = 'typequest-theme';
const CHOICES = ['light', 'dark', 'system'];
const META_COLOR = {light: '#efe6d0', dark: '#171310'};

const listeners = new Set();

function systemQuery() {
    return typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
}

function readPreference() {
    try {
        const saved = localStorage.getItem(KEY);

        return CHOICES.includes(saved) ? saved : 'system';
    } catch {
        return 'system';
    }
}

function resolve(preference) {
    if (preference === 'system') {
        return systemQuery()?.matches ? 'dark' : 'light';
    }

    return preference;
}

let snapshot = {preference: readPreference(), resolved: resolve(readPreference())};

function apply() {
    document.documentElement.dataset.theme = snapshot.resolved;

    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', META_COLOR[snapshot.resolved]);
}

function update(preference) {
    const resolved = resolve(preference);

    if (snapshot.preference === preference && snapshot.resolved === resolved) return;

    snapshot = {preference, resolved};
    apply();
    listeners.forEach((listener) => listener());
}

export function setThemePreference(preference) {
    if (!CHOICES.includes(preference)) return;

    try {
        localStorage.setItem(KEY, preference);
    } catch {
        // The choice just is not remembered.
    }

    update(preference);
}

export function getThemeSnapshot() {
    return snapshot;
}

export function subscribeTheme(listener) {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

// Follow the operating system while "System" is chosen.
export function startThemeWatcher() {
    apply();

    const query = systemQuery();

    if (!query) return;

    query.addEventListener('change', () => {
        if (snapshot.preference === 'system') update('system');
    });
}

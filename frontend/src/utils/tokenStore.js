// Where the refresh token lives in the browser.
//   "Keep me signed in" ticked   -> localStorage   (survives closing the tab or browser)
//   unticked (shared computers)  -> sessionStorage (gone when the tab closes)
// Either way it is only the refresh token; the short-lived access token stays in memory.
const KEY = 'typequest_refresh_token';

function read(storage) {
    try {
        return storage.getItem(KEY) || '';
    } catch {
        return '';
    }
}

function write(storage, token) {
    try {
        storage.setItem(KEY, token);
        return true;
    } catch {
        return false;
    }
}

function remove(storage) {
    try {
        storage.removeItem(KEY);
    } catch {
        // Storage blocked: nothing to remove.
    }
}

export const tokenStore = {
    get() {
        return read(window.localStorage) || read(window.sessionStorage);
    },

    // Is the stored token the long-lived (remembered) kind?
    isRemembered() {
        return Boolean(read(window.localStorage));
    },

    // remember: true / false to choose, undefined to keep wherever it already is
    // (a token refresh must not move the token to the other storage).
    set(token, remember) {
        const keep = remember === undefined ? this.isRemembered() : remember;

        remove(window.localStorage);
        remove(window.sessionStorage);

        const preferred = keep ? window.localStorage : window.sessionStorage;
        const fallback = keep ? window.sessionStorage : window.localStorage;

        if (!write(preferred, token)) {
            write(fallback, token);
        }
    },

    clear() {
        remove(window.localStorage);
        remove(window.sessionStorage);
    },
};

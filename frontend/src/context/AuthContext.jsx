import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {authService} from '../services/authService';
import {apiRequest} from '../services/api';
import {tokenStore} from '../utils/tokenStore';

const AuthContext = createContext(null);

// After a failed refresh we only sign the user out when the server REJECTED the token.
// A sleeping or unreachable server (Render's free plan sleeps) must not sign anyone out.
const TOKEN_REJECTED = new Set([400, 401, 403]);
const RESTORE_RETRY_DELAYS_MS = [2000, 5000, 10000, 20000];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The access token carries the user's roles. This is only used to decide what
// to show: the server checks the role again on every admin request.
function rolesFromToken(token) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(payload)
                .split('')
                .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
                .join(''),
        );
        const roles = JSON.parse(json).roles;

        return Array.isArray(roles) ? roles : [];
    } catch {
        return [];
    }
}

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

// Share a single refresh operation between concurrent callers.
    const refreshPromiseRef = useRef(null);

// Prevent an older asynchronous operation from restoring a cleared session.
    const sessionVersionRef = useRef(0);

// Prevent repeated logout requests.
    const logoutPromiseRef = useRef(null);

// Always holds the newest access token, so callers never use a stale one.
    const accessTokenRef = useRef(null);

    const clearSession = useCallback(() => {
        sessionVersionRef.current += 1;


        setUser(null);
        setAccessToken(null);
        accessTokenRef.current = null;

        tokenStore.clear();


    }, []);

    const saveSession = useCallback((response, remember) => {
        if (!response?.accessToken || !response?.refreshToken) {
            throw new Error(
                'The server did not return valid authentication tokens.',
            );
        }


        const authenticatedUser = {
            userId: response.userId,
            username: response.username,
            email: response.email,
        };

        setUser(authenticatedUser);
        setAccessToken(response.accessToken);
        accessTokenRef.current = response.accessToken;

// localStorage when the user ticked "Keep me signed in", otherwise sessionStorage.
// An HttpOnly cookie would be safer against XSS (see the ideas-for-later list).
        tokenStore.set(response.refreshToken, remember);


    }, []);

    const register = useCallback(async (formData) => {
        return authService.register(formData);
    }, []);

    const login = useCallback(
        async (credentials) => {
// Invalidate older asynchronous session operations.
            sessionVersionRef.current += 1;


            const {rememberMe, ...loginBody} = credentials;
            const response = await authService.login(loginBody);

            saveSession(response, Boolean(rememberMe));

            return response;
        },
        [saveSession],
    );

    const refreshSession = useCallback(async () => {
// Reuse an existing refresh operation rather than rotating the
// same refresh token multiple times concurrently.
        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }


        const refreshToken = tokenStore.get();

        if (!refreshToken) {
            clearSession();
            return false;
        }

        const operationVersion = sessionVersionRef.current;

        const refreshOperation = (async () => {
            try {
                const response = await authService.refresh(refreshToken);

                // Do not restore a session if logout or another login occurred
                // while the refresh request was in flight.
                if (operationVersion !== sessionVersionRef.current) {
                    return false;
                }

                saveSession(response);

                return true;
            } catch (error) {
                // Only a rejected token ends the session. A network error, a timeout
                // or a 5xx (server still waking up) keeps the token for a retry.
                if (operationVersion === sessionVersionRef.current && TOKEN_REJECTED.has(error.status)) {
                    clearSession();
                }

                return false;
            }
        })();

        refreshPromiseRef.current = refreshOperation;

        try {
            return await refreshOperation;
        } finally {
            if (refreshPromiseRef.current === refreshOperation) {
                refreshPromiseRef.current = null;
            }
        }


    }, [clearSession, saveSession]);

    // Authenticated API call. If the 15-minute access token has expired
    // (HTTP 401) the session is refreshed once and the request is retried.
    const authRequest = useCallback(
        async (endpoint, options = {}) => {
            if (!accessTokenRef.current) {
                throw new Error('You must be logged in.');
            }

            try {
                return await apiRequest(endpoint, {
                    ...options,
                    token: accessTokenRef.current,
                });
            } catch (error) {
                if (error.status !== 401) {
                    throw error;
                }

                const refreshed = await refreshSession();

                if (!refreshed || !accessTokenRef.current) {
                    throw error;
                }

                return apiRequest(endpoint, {
                    ...options,
                    token: accessTokenRef.current,
                });
            }
        },
        [refreshSession],
    );

    const logout = useCallback(async () => {
// If logout is already running, reuse its result.
        if (logoutPromiseRef.current) {
            return logoutPromiseRef.current;
        }


        const currentAccessToken = accessToken;
        const refreshToken = tokenStore.get();

// Immediately invalidate local authentication.
        clearSession();

        const logoutOperation = (async () => {
            if (currentAccessToken && refreshToken) {
                await authService.logout(currentAccessToken, refreshToken);
            }
        })();

        logoutPromiseRef.current = logoutOperation;

        try {
            await logoutOperation;
        } finally {
            logoutPromiseRef.current = null;
        }


    }, [accessToken, clearSession]);

    useEffect(() => {
        let cancelled = false;


        async function restoreSession() {
            try {
                // Retry while the server wakes up instead of signing the user out.
                for (let attempt = 0; attempt <= RESTORE_RETRY_DELAYS_MS.length; attempt += 1) {
                    if (!tokenStore.get() || cancelled) {
                        return;
                    }

                    if (await refreshSession()) {
                        return;
                    }

                    if (attempt < RESTORE_RETRY_DELAYS_MS.length) {
                        await wait(RESTORE_RETRY_DELAYS_MS[attempt]);
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        restoreSession();

        return () => {
            cancelled = true;
        };


    }, [refreshSession]);

    // Coming back to the tab: if a saved login could not be restored earlier (for example
    // the server was asleep), try once more.
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible' && !accessTokenRef.current && tokenStore.get()) {
                refreshSession();
            }
        };

        document.addEventListener('visibilitychange', onVisible);

        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [refreshSession]);

    // The refresh token identifies this device's session (the server keeps it
    // signed in when the password changes and signs the other devices out).
    const getRefreshToken = useCallback(
        () => tokenStore.get(),
        [],
    );

    const isAdmin = useMemo(
        () => Boolean(accessToken) && rolesFromToken(accessToken).includes('ROLE_ADMIN'),
        [accessToken],
    );

    const value = useMemo(
        () => ({
            user,
            accessToken,
            loading,
            isAuthenticated: Boolean(user && accessToken),
            isAdmin,
            register,
            login,
            logout,
            refreshSession,
            authRequest,
            getRefreshToken,
            endSession: clearSession,
        }),
        [
            user,
            accessToken,
            loading,
            isAdmin,
            register,
            login,
            logout,
            refreshSession,
            authRequest,
            getRefreshToken,
            clearSession,
        ],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside an AuthProvider.',
        );
    }

    return context;
}

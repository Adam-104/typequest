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

const AuthContext = createContext(null);

const REFRESH_TOKEN_KEY = 'typequest_refresh_token';

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

        sessionStorage.removeItem(REFRESH_TOKEN_KEY);


    }, []);

    const saveSession = useCallback((response) => {
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

// Temporary storage strategy for the current backend contract.
// An HttpOnly cookie is preferable for production refresh tokens.
        sessionStorage.setItem(
            REFRESH_TOKEN_KEY,
            response.refreshToken,
        );


    }, []);

    const register = useCallback(async (formData) => {
        return authService.register(formData);
    }, []);

    const login = useCallback(
        async (credentials) => {
// Invalidate older asynchronous session operations.
            sessionVersionRef.current += 1;


            const response = await authService.login(credentials);

            saveSession(response);

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


        const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);

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
                if (operationVersion === sessionVersionRef.current) {
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
        const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);

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
                if (!sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
                    return;
                }

                await refreshSession();
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

    // The refresh token identifies this device's session (the server keeps it
    // signed in when the password changes and signs the other devices out).
    const getRefreshToken = useCallback(
        () => sessionStorage.getItem(REFRESH_TOKEN_KEY) || '',
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

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {useAuth} from './AuthContext';
import {gameService, userService} from '../services/gameService';

const PlayerContext = createContext(null);

// Holds the signed-in player's profile (XP, level) and game history so every
// page shows the same, server-backed numbers.
export function PlayerProvider({children}) {
    const {isAuthenticated, user, authRequest} = useAuth();

    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const requestIdRef = useRef(0);

    const reload = useCallback(async () => {
        if (!isAuthenticated) {
            return;
        }

        const requestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);

        try {
            const [nextProfile, nextHistory] = await Promise.all([
                userService.getProfile(authRequest),
                gameService.getHistory(authRequest),
            ]);

            if (requestId !== requestIdRef.current) return;

            setProfile(nextProfile);
            setHistory(Array.isArray(nextHistory) ? nextHistory : []);
        } catch (requestError) {
            if (requestId !== requestIdRef.current) return;

            setError(requestError.message || 'Unable to load your progress.');
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [isAuthenticated, authRequest]);

    useEffect(() => {
        if (isAuthenticated) {
            reload();
        } else {
            requestIdRef.current += 1;
            setProfile(null);
            setHistory([]);
            setError(null);
            setLoading(false);
        }
    }, [isAuthenticated, user?.userId, reload]);

    // Saves a finished game and refreshes XP / level / history.
    const submitGame = useCallback(
        async (result) => {
            const response = await gameService.submitResult(authRequest, result);

            reload();

            return response;
        },
        [authRequest, reload],
    );

    const value = useMemo(
        () => ({profile, history, loading, error, reload, submitGame}),
        [profile, history, loading, error, reload, submitGame],
    );

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);

    if (!context) {
        throw new Error('usePlayer must be used inside a PlayerProvider.');
    }

    return context;
}

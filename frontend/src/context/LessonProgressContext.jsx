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
import {lessonProgressService} from '../services/lessonProgressService';

const LessonProgressContext = createContext(null);

const EMPTY = {completed: false, bestWpm: 0, accuracy: 0, completedAt: null};

function normalizeProgress(list) {
    return list.reduce((result, item) => {
        result[item.lessonId] = {
            completed: Boolean(item.completed),
            bestWpm: Number(item.bestWpm) || 0,
            accuracy: Number(item.accuracy) || 0,
            completedAt: item.completedAt ?? null,
        };

        return result;
    }, {});
}

export function LessonProgressProvider({children}) {
    const {user, isAuthenticated, authRequest} = useAuth();

    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const progressRef = useRef({});
    const userIdRef = useRef(null);
    const saveQueueRef = useRef(Promise.resolve());

    const apply = useCallback((next) => {
        progressRef.current = next;
        setProgress(next);
    }, []);

    const loadProgress = useCallback(async () => {
        if (!isAuthenticated || !user?.userId) {
            apply({});
            setLoading(false);

            return;
        }

        const currentUserId = String(user.userId);

        userIdRef.current = currentUserId;
        setLoading(true);
        setError(null);

        try {
            const result = await lessonProgressService.getAllProgress(authRequest);

            if (userIdRef.current === currentUserId) {
                apply(normalizeProgress(Array.isArray(result) ? result : []));
            }
        } catch (requestError) {
            if (userIdRef.current === currentUserId) {
                setError(requestError.message || 'Unable to load lesson progress.');
            }
        } finally {
            if (userIdRef.current === currentUserId) setLoading(false);
        }
    }, [apply, authRequest, isAuthenticated, user?.userId]);

    useEffect(() => {
        if (!isAuthenticated || !user?.userId) {
            userIdRef.current = null;
            apply({});
            setLoading(false);
            setError(null);

            return;
        }

        loadProgress();
    }, [apply, isAuthenticated, user?.userId, loadProgress]);

    // Saves are queued so two quick finishes cannot overwrite each other.
    const saveProgress = useCallback((lessonId, {wpm = 0, accuracy = 0, completed = false} = {}) => {
        if (!isAuthenticated || !user?.userId) {
            return Promise.reject(new Error('You must be logged in to save lesson progress.'));
        }

        const currentUserId = String(user.userId);

        const operation = async () => {
            if (userIdRef.current !== currentUserId) {
                throw new Error('Your account changed. Please try again.');
            }

            await lessonProgressService.saveProgress(authRequest, {lessonId, wpm, accuracy, completed});

            if (userIdRef.current !== currentUserId) return;

            const previous = progressRef.current[lessonId] ?? EMPTY;

            apply({
                ...progressRef.current,
                [lessonId]: {
                    completed: Boolean(previous.completed || completed),
                    bestWpm: Math.max(previous.bestWpm, Number(wpm) || 0),
                    accuracy: Math.max(previous.accuracy, Number(accuracy) || 0),
                    completedAt: completed
                        ? previous.completedAt || new Date().toISOString()
                        : previous.completedAt,
                },
            });
            setError(null);
        };

        const queued = saveQueueRef.current.then(operation, operation);

        saveQueueRef.current = queued.catch(() => {});

        return queued;
    }, [apply, authRequest, isAuthenticated, user?.userId]);

    const getLessonProgress = useCallback(
        (lessonId) => progress[lessonId] ?? EMPTY,
        [progress],
    );

    const completedLessonCount = useMemo(
        () => Object.values(progress).filter((item) => item.completed).length,
        [progress],
    );

    const value = useMemo(
        () => ({
            progress,
            loading,
            error,
            completedLessonCount,
            loadProgress,
            saveProgress,
            getLessonProgress,
        }),
        [progress, loading, error, completedLessonCount, loadProgress, saveProgress, getLessonProgress],
    );

    return (
        <LessonProgressContext.Provider value={value}>
            {children}
        </LessonProgressContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLessonProgress() {
    const context = useContext(LessonProgressContext);

    if (!context) {
        throw new Error('useLessonProgress must be used inside a LessonProgressProvider.');
    }

    return context;
}

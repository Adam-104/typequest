import {useCallback, useRef, useState} from 'react';

import {useAuth} from '../context/AuthContext';
import {usePlayer} from '../context/PlayerContext';

const IDLE = {status: 'idle', reward: null, error: null};

// Sends a finished game to the backend and tracks the outcome
// (saving -> saved with XP reward, or error with retry).
export default function useGameSubmission() {
    const {submitGame} = usePlayer();
    const {isAuthenticated} = useAuth();

    const [submission, setSubmission] = useState(IDLE);

    const lastPayloadRef = useRef(null);
    const tokenRef = useRef(0);

    const submit = useCallback(
        async (payload) => {
            lastPayloadRef.current = payload;

            // Visitors can play, but there is no account to save the result to.
            if (!isAuthenticated) {
                setSubmission({status: 'guest', reward: null, error: null});

                return;
            }

            const token = ++tokenRef.current;

            setSubmission({status: 'saving', reward: null, error: null});

            try {
                const reward = await submitGame(payload);

                if (token === tokenRef.current) {
                    setSubmission({status: 'saved', reward, error: null});
                }
            } catch (error) {
                if (token === tokenRef.current) {
                    setSubmission({
                        status: 'error',
                        reward: null,
                        error: error.message || 'Could not save your result.',
                    });
                }
            }
        },
        [submitGame, isAuthenticated],
    );

    const retry = useCallback(() => {
        if (lastPayloadRef.current) {
            submit(lastPayloadRef.current);
        }
    }, [submit]);

    const reset = useCallback(() => {
        tokenRef.current += 1;
        lastPayloadRef.current = null;
        setSubmission(IDLE);
    }, []);

    return {submission, submit, retry, reset};
}

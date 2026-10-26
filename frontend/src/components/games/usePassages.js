import {useEffect, useMemo, useState} from 'react';

import {useAuth} from '../../context/AuthContext';

// Texts for a passage game: the admin-managed ones when there are any, else
// the built-in ones. `ready` turns true once the server has answered (or
// failed), so a game never starts with a text that is about to change.
export default function usePassages(category, builtIn) {
    const {authRequest} = useAuth();
    const [custom, setCustom] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        authRequest(`/api/passages?category=${category}`)
            .then((list) => {
                if (!cancelled && Array.isArray(list) && list.length > 0) setCustom(list);
            })
            .catch(() => {
                // Offline or an old server: the built-in texts are fine.
            })
            .finally(() => {
                if (!cancelled) setReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, [authRequest, category]);

    const passages = useMemo(() => custom ?? builtIn, [custom, builtIn]);

    return {passages, ready};
}

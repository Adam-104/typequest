import {useEffect, useState} from 'react';

// True when something has been "loading" for longer than `afterMs`.
export default function useSlowHint(loading, afterMs = 5000) {
    const [slow, setSlow] = useState(false);

    useEffect(() => {
        if (!loading) {
            setSlow(false);

            return undefined;
        }

        const timer = setTimeout(() => setSlow(true), afterMs);

        return () => clearTimeout(timer);
    }, [loading, afterMs]);

    return slow;
}

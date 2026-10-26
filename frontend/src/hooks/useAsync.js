import {useCallback, useEffect, useRef, useState} from 'react';

// Runs an async loader and keeps {data, loading, error}. Call reload() to
// run it again (for example after an edit). Pass a stable (useCallback)
// loader: a new loader function triggers a new load.
export default function useAsync(loader) {
    const [state, setState] = useState({data: null, loading: true, error: null});
    const latest = useRef(0);

    const run = useCallback(async () => {
        const id = ++latest.current;

        setState((previous) => ({...previous, loading: true, error: null}));

        try {
            const data = await loader();

            if (id === latest.current) setState({data, loading: false, error: null});
        } catch (error) {
            if (id === latest.current) {
                setState((previous) => ({
                    data: previous.data,
                    loading: false,
                    error: error.message || 'Something went wrong.',
                }));
            }
        }
    }, [loader]);

    useEffect(() => {
        run();

        return () => {
            latest.current += 1;
        };
    }, [run]);

    return {...state, reload: run};
}

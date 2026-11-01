import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

import {getLevels, setCurriculum} from '../data/curriculum';
import {apiRequest} from '../services/api';

// Loads the course from the server (public, no sign-in needed). While that is
// loading, or if it fails, the built-in course in data/curriculum.js is used,
// so the lessons always work. Components call useCurriculum() so they redraw
// when the server copy arrives or an admin changes a lesson.
const CurriculumContext = createContext(null);

export function CurriculumProvider({children}) {
    const [version, setVersion] = useState(0);
    const [source, setSource] = useState('built-in'); // built-in | server

    const reload = useCallback(async () => {
        try {
            const levels = await apiRequest('/api/lessons');

            if (setCurriculum(levels)) {
                setSource('server');
                setVersion((value) => value + 1);
            }
        } catch {
            // Keep whatever course is showing now.
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    const value = useMemo(
        // version is read so the memo (and every consumer) updates after a load.
        () => ({levels: getLevels(), version, source, reload}),
        [version, source, reload],
    );

    return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
}

export function useCurriculum() {
    const context = useContext(CurriculumContext);

    if (!context) throw new Error('useCurriculum must be used inside CurriculumProvider.');

    return context;
}

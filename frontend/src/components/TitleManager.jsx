import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

import {useCurriculum} from '../context/CurriculumContext';
import {fullTitle, titleFor} from '../utils/pageTitle';

// Keeps the browser tab title in step with the page, in one place.
export default function TitleManager() {
    const {pathname} = useLocation();

    // Lesson titles can arrive after the page opens, so redo the title then too.
    const {version} = useCurriculum();

    useEffect(() => {
        document.title = fullTitle(titleFor(pathname));
    }, [pathname, version]);

    return null;
}

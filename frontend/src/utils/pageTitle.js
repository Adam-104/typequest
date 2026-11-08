import {matchPath} from 'react-router-dom';

import {getLesson} from '../data/curriculum';

export const SITE_NAME = 'TypeQuest';
export const DEFAULT_TITLE = 'TypeQuest – Learn to type, play to win';

const TITLES = {
    '/login': 'Log in',
    '/register': 'Create your account',
    '/reset-password': 'Reset your password',
    '/verify-email': 'Confirm your email',
    '/learn': 'Learn',
    '/practice': 'Practice',
    '/games': 'Play games',
    '/games/typing-speed': 'Typing Speed',
    '/games/typing-racer': 'Typing Racer',
    '/games/word-survival': 'Word Survival',
    '/games/space-mission': 'Space Mission',
    '/games/ninja-word-strike': 'Ninja Word Strike',
    '/history': 'History',
    '/leaderboard': 'Leaderboard',
    '/achievements': 'Achievements',
    '/settings': 'Settings',
    '/admin': 'Admin',
    '/admin/users': 'Admin: users',
    '/admin/scores': 'Admin: scores',
    '/admin/content': 'Admin: game texts',
    '/admin/lessons': 'Admin: lessons',
    '/privacy': 'Privacy',
    '/terms': 'Terms',
};

// The text for the browser tab, for one address. null means "use the default"
// (the home address, which is the welcome page or the dashboard).
export function titleFor(pathname) {
    const lessonMatch = matchPath('/learn/lesson/:lessonId', pathname);

    if (lessonMatch) {
        const lesson = getLesson(lessonMatch.params.lessonId);

        return lesson ? `${lesson.title} · Lesson ${lesson.id}` : 'Lesson';
    }

    const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

    if (clean === '/') {
        return null;
    }

    // Anything else is an address that does not exist.
    return TITLES[clean] ?? 'Page not found';
}

export function fullTitle(title) {
    return title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
}

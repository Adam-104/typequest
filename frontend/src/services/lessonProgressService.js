// Lesson progress API. Every call goes through AuthContext's authRequest,
// which refreshes an expired access token and retries once.

export const lessonProgressService = {
    getAllProgress(authRequest) {
        return authRequest('/api/lesson-progress');
    },

    saveProgress(authRequest, {lessonId, wpm, accuracy, completed}) {
        return authRequest('/api/lesson-progress', {
            method: 'POST',
            body: {lessonId, wpm, accuracy, completed},
        });
    },
};

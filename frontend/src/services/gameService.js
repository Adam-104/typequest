// Thin wrappers around the TypeQuest REST API. Every function takes the
// `authRequest` helper from useAuth(), which handles token refresh.

export const gameService = {
    submitResult(authRequest, result) {
        return authRequest('/api/games/typing-challenge', {
            method: 'POST',
            body: result,
        });
    },

    getHistory(authRequest) {
        return authRequest('/api/games/history');
    },
};

export const userService = {
    getProfile(authRequest) {
        return authRequest('/api/users/me');
    },
};

export const leaderboardService = {
    getTop(authRequest) {
        return authRequest('/api/leaderboard');
    },

    getMyRank(authRequest) {
        return authRequest('/api/leaderboard/me');
    },
};

export const achievementService = {
    getAll(authRequest) {
        return authRequest('/api/achievements');
    },

    getMine(authRequest) {
        return authRequest('/api/achievements/my-achievements');
    },
};

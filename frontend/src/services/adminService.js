// Admin API. Every call goes through AuthContext's authRequest; the server
// rejects anyone who is not an admin.

const query = (params) => {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, value);
    });

    const text = search.toString();

    return text ? `?${text}` : '';
};

export const adminService = {
    stats: (authRequest) => authRequest('/api/admin/stats'),

    users: (authRequest, {q = '', page = 0, size = 15} = {}) =>
        authRequest(`/api/admin/users${query({q, page, size})}`),

    updateUser: (authRequest, id, changes) =>
        authRequest(`/api/admin/users/${id}`, {method: 'PATCH', body: changes}),

    unlockUser: (authRequest, id) =>
        authRequest(`/api/admin/users/${id}/unlock`, {method: 'POST'}),

    resetXp: (authRequest, id) =>
        authRequest(`/api/admin/users/${id}/reset-xp`, {method: 'POST'}),

    games: (authRequest, {page = 0, size = 15} = {}) =>
        authRequest(`/api/admin/games${query({page, size})}`),

    deleteGame: (authRequest, id) =>
        authRequest(`/api/admin/games/${id}`, {method: 'DELETE'}),

    achievements: (authRequest) => authRequest('/api/achievements'),

    updateAchievement: (authRequest, id, body) =>
        authRequest(`/api/admin/achievements/${id}`, {method: 'PUT', body}),

    passages: (authRequest) => authRequest('/api/admin/passages'),

    createPassage: (authRequest, body) =>
        authRequest('/api/admin/passages', {method: 'POST', body}),

    updatePassage: (authRequest, id, body) =>
        authRequest(`/api/admin/passages/${id}`, {method: 'PUT', body}),

    deletePassage: (authRequest, id) =>
        authRequest(`/api/admin/passages/${id}`, {method: 'DELETE'}),

    importPassages: (authRequest, passages) =>
        authRequest('/api/admin/passages/import', {method: 'POST', body: {passages}}),
};

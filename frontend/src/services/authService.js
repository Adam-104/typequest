import {apiRequest} from './api';

export const authService = {
    async register({username, email, password}) {
        return apiRequest('/api/auth/register', {
            method: 'POST',
            body: {
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password,
            },
        });
    },

    async login({email, password}) {
        const response = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: {
                email: email.trim().toLowerCase(),
                password,
            },
        });


// The Spring Boot AuthResponse uses "token".
// Normalize it to "accessToken" for the React application.
        const accessToken = response?.accessToken ?? response?.token;

        if (!accessToken || !response?.refreshToken) {
            throw new Error(
                'The server response did not contain the expected authentication tokens.',
            );
        }

        return {
            ...response,
            accessToken,
        };


    },

    async refresh(refreshToken) {
        const response = await apiRequest('/api/auth/refresh', {
            method: 'POST',
            body: {refreshToken},
        });


// RefreshTokenResponse uses "accessToken".
        if (!response?.accessToken || !response?.refreshToken) {
            throw new Error(
                'The refresh response did not contain the expected authentication tokens.',
            );
        }

        return response;


    },

    async logout(accessToken, refreshToken) {
        return apiRequest('/api/auth/logout', {
            method: 'POST',
            token: accessToken,
            body: {refreshToken},
        });
    },
};

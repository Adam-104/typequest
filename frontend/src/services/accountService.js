// Account settings API (signed-in calls go through authRequest, which
// refreshes an expired access token) and the public email-confirmation call.

import {apiRequest} from './api';

export const accountService = {
    changePassword: (authRequest, {currentPassword, newPassword, refreshToken}) =>
        authRequest('/api/account/change-password', {
            method: 'POST',
            body: {currentPassword, newPassword, refreshToken},
        }),

    changeEmail: (authRequest, {currentPassword, newEmail}) =>
        authRequest('/api/account/change-email', {
            method: 'POST',
            body: {currentPassword, newEmail: newEmail.trim().toLowerCase()},
        }),

    resendVerification: (authRequest) =>
        authRequest('/api/account/resend-verification', {method: 'POST'}),

    deleteAccount: (authRequest, {password}) =>
        authRequest('/api/account/delete', {method: 'POST', body: {password}}),

    // Public: the link in the email may be opened on another device.
    verifyEmail: (token) =>
        apiRequest('/api/auth/verify-email', {method: 'POST', body: {token}}),
};

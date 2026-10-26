import {useCallback, useEffect, useState} from 'react';

import AdminShell from '../../components/AdminShell';
import {ErrorState, LoadingRows} from '../../components/PageStates';
import {useAuth} from '../../context/AuthContext';
import useAsync from '../../hooks/useAsync';
import {adminService} from '../../services/adminService';
import {formatDate} from '../../utils/adminFormat';

const PAGE_SIZE = 15;

export default function AdminUsers() {
    const {authRequest, user: me} = useAuth();

    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [busyId, setBusyId] = useState(null);
    const [message, setMessage] = useState(null);

    // Wait for the person to stop typing before searching.
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim());
            setPage(0);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const load = useCallback(
        () => adminService.users(authRequest, {q: query, page, size: PAGE_SIZE}),
        [authRequest, query, page],
    );
    const {data, loading, error, reload} = useAsync(load);

    async function act(row, label, action, confirmText) {
        if (confirmText && !window.confirm(confirmText)) return;

        setBusyId(row.id);
        setMessage(null);

        try {
            await action();
            setMessage({ok: true, text: `${label}: ${row.username}`});
            await reload();
        } catch (actionError) {
            setMessage({ok: false, text: actionError.message || 'That did not work.'});
        } finally {
            setBusyId(null);
        }
    }

    const update = (row, changes) => adminService.updateUser(authRequest, row.id, changes);

    const items = data?.items ?? [];
    const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

    return (
        <AdminShell
            title="Players."
            intro="Find a player, switch an account off, or take someone off the leaderboard."
        >
            <section className="page-card">
                <div className="admin-toolbar">
                    <label className="admin-search">
                        <span className="admin-sr">Search players</span>
                        <input
                            type="search"
                            placeholder="Search by name or email"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>

                    <span className="admin-count">
                        {data ? `${data.total} player${data.total === 1 ? '' : 's'}` : ''}
                    </span>
                </div>

                {message && (
                    <p className={`admin-message${message.ok ? '' : ' is-error'}`} role="status">
                        {message.text}
                    </p>
                )}

                {error && !data ? (
                    <ErrorState message={error} onRetry={reload}/>
                ) : loading && !data ? (
                    <LoadingRows count={6}/>
                ) : items.length === 0 ? (
                    <p className="page-note">No players match that search.</p>
                ) : (
                    <div className="table-scroll">
                        <table className="data-table admin-table">
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Level</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => {
                                    const isMe = String(row.id) === String(me?.userId);
                                    const isAdmin = row.role === 'ROLE_ADMIN';
                                    const busy = busyId === row.id;

                                    return (
                                        <tr key={row.id} className={row.disabled ? 'is-off' : ''}>
                                            <td>
                                                <strong>{row.username}</strong>
                                                {isMe && <span className="you-tag">you</span>}
                                                <small className="admin-sub">{row.email}</small>
                                            </td>
                                            <td>
                                                {row.level}
                                                <small className="admin-sub">{row.totalXp.toLocaleString()} XP</small>
                                            </td>
                                            <td>
                                                <span className="admin-tags">
                                                    {isAdmin && <i className="admin-tag is-admin">admin</i>}
                                                    {row.disabled && <i className="admin-tag is-bad">disabled</i>}
                                                    {row.locked && <i className="admin-tag is-warn">locked</i>}
                                                    {row.leaderboardBanned && <i className="admin-tag is-warn">off leaderboard</i>}
                                                    {!isAdmin && !row.disabled && !row.locked && !row.leaderboardBanned && (
                                                        <i className="admin-tag">active</i>
                                                    )}
                                                </span>
                                            </td>
                                            <td>{formatDate(row.createdAt)}</td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        type="button"
                                                        disabled={busy || isMe}
                                                        onClick={() => act(
                                                            row,
                                                            row.disabled ? 'Enabled' : 'Disabled',
                                                            () => update(row, {disabled: !row.disabled}),
                                                            row.disabled ? null : `Disable ${row.username}? They will be signed out and cannot log in.`,
                                                        )}
                                                    >
                                                        {row.disabled ? 'Enable' : 'Disable'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => act(
                                                            row,
                                                            row.leaderboardBanned ? 'Back on leaderboard' : 'Removed from leaderboard',
                                                            () => update(row, {leaderboardBanned: !row.leaderboardBanned}),
                                                        )}
                                                    >
                                                        {row.leaderboardBanned ? 'Restore rank' : 'Hide from board'}
                                                    </button>

                                                    {row.locked && (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() => act(row, 'Unlocked', () => adminService.unlockUser(authRequest, row.id))}
                                                        >
                                                            Unlock
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        disabled={busy || isMe}
                                                        onClick={() => act(
                                                            row,
                                                            isAdmin ? 'Now a regular player' : 'Now an admin',
                                                            () => update(row, {role: isAdmin ? 'ROLE_USER' : 'ROLE_ADMIN'}),
                                                            isAdmin
                                                                ? `Remove admin rights from ${row.username}?`
                                                                : `Make ${row.username} an admin? They will be able to manage every account.`,
                                                        )}
                                                    >
                                                        {isAdmin ? 'Remove admin' : 'Make admin'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="is-danger"
                                                        disabled={busy}
                                                        onClick={() => act(
                                                            row,
                                                            'XP reset',
                                                            () => adminService.resetXp(authRequest, row.id),
                                                            `Reset ${row.username} to 0 XP and level 1? This cannot be undone.`,
                                                        )}
                                                    >
                                                        Reset XP
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div className="admin-pager">
                        <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
                            ← Newer
                        </button>
                        <span>Page {page + 1} of {pages}</span>
                        <button type="button" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
                            Older →
                        </button>
                    </div>
                )}
            </section>
        </AdminShell>
    );
}

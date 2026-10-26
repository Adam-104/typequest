import {useCallback, useState} from 'react';

import AdminShell from '../../components/AdminShell';
import {ErrorState, LoadingRows} from '../../components/PageStates';
import {useAuth} from '../../context/AuthContext';
import useAsync from '../../hooks/useAsync';
import {adminService} from '../../services/adminService';
import {formatDate, gameName} from '../../utils/adminFormat';

const PAGE_SIZE = 15;

export default function AdminScores() {
    const {authRequest} = useAuth();
    const [page, setPage] = useState(0);
    const [busyId, setBusyId] = useState(null);
    const [message, setMessage] = useState(null);

    const load = useCallback(
        () => adminService.games(authRequest, {page, size: PAGE_SIZE}),
        [authRequest, page],
    );
    const {data, loading, error, reload} = useAsync(load);

    async function remove(row) {
        const ok = window.confirm(
            `Delete ${row.username}'s ${gameName(row.gameType)} result (${row.wpm} WPM)? This cannot be undone.`,
        );

        if (!ok) return;

        setBusyId(row.id);
        setMessage(null);

        try {
            await adminService.deleteGame(authRequest, row.id);
            setMessage({ok: true, text: 'Result deleted.'});
            await reload();
        } catch (actionError) {
            setMessage({ok: false, text: actionError.message || 'That did not work.'});
        } finally {
            setBusyId(null);
        }
    }

    const items = data?.items ?? [];
    const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

    return (
        <AdminShell
            title="Scores."
            intro="Every game result, newest first. Remove anything that looks wrong."
        >
            <section className="page-card">
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
                    <p className="page-note">No games have been played yet.</p>
                ) : (
                    <div className="table-scroll">
                        <table className="data-table admin-table">
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Game</th>
                                    <th>WPM</th>
                                    <th>Accuracy</th>
                                    <th>Time</th>
                                    <th>Played</th>
                                    <th><span className="admin-sr">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id}>
                                        <td><strong>{row.username}</strong></td>
                                        <td>
                                            {gameName(row.gameType)}
                                            <small className="admin-sub">{row.difficulty}</small>
                                        </td>
                                        <td className={row.wpm >= 150 ? 'admin-flag' : ''}>{row.wpm ?? '—'}</td>
                                        <td>{row.accuracy != null ? `${Math.round(row.accuracy)}%` : '—'}</td>
                                        <td>{row.durationSeconds != null ? `${row.durationSeconds}s` : '—'}</td>
                                        <td>{formatDate(row.playedAt)}</td>
                                        <td>
                                            <div className="admin-actions">
                                                <button
                                                    type="button"
                                                    className="is-danger"
                                                    disabled={busyId === row.id}
                                                    onClick={() => remove(row)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="page-note">Speeds of 150 WPM or more are marked in red.</p>

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

import {useCallback} from 'react';

import AdminShell from '../../components/AdminShell';
import {ErrorState, LoadingRows} from '../../components/PageStates';
import StatCard from '../../components/StatCard';
import {useAuth} from '../../context/AuthContext';
import useAsync from '../../hooks/useAsync';
import {adminService} from '../../services/adminService';
import {formatDate, gameName} from '../../utils/adminFormat';

export default function AdminOverview() {
    const {authRequest} = useAuth();
    const load = useCallback(() => adminService.stats(authRequest), [authRequest]);
    const {data: stats, loading, error, reload} = useAsync(load);

    const types = stats ? Object.entries(stats.gamesByType) : [];
    const topCount = Math.max(1, ...types.map(([, count]) => count));

    return (
        <AdminShell
            title="How TypeQuest is doing."
            intro="A quick look at players, games and lessons."
        >
            {error && !stats ? (
                <ErrorState message={error} onRetry={reload}/>
            ) : loading && !stats ? (
                <LoadingRows count={4}/>
            ) : stats && (
                <>
                    <section className="stats-grid" aria-label="Totals">
                        <StatCard
                            icon="☺"
                            label="PLAYERS"
                            value={stats.totalUsers.toLocaleString()}
                            detail={`${stats.newUsersLast7Days} joined in the last 7 days`}
                            color="purple"
                        />
                        <StatCard
                            icon="▣"
                            label="GAMES PLAYED"
                            value={stats.totalGames.toLocaleString()}
                            detail={`${stats.gamesLast7Days} in the last 7 days`}
                            color="blue"
                        />
                        <StatCard
                            icon="⌨"
                            label="AVERAGE SPEED"
                            value={stats.averageWpm}
                            unit=" WPM"
                            detail={`${stats.averageAccuracy}% average accuracy`}
                            color="green"
                        />
                        <StatCard
                            icon="▤"
                            label="LESSONS PASSED"
                            value={stats.lessonsCompleted.toLocaleString()}
                            detail={stats.disabledUsers
                                ? `${stats.disabledUsers} disabled account${stats.disabledUsers === 1 ? '' : 's'}`
                                : 'No disabled accounts'}
                            color="orange"
                        />
                    </section>

                    <div className="admin-two-col">
                        <section className="page-card">
                            <h2>Games by type</h2>

                            {types.length === 0 ? (
                                <p className="page-note">No games have been played yet.</p>
                            ) : (
                                <ul className="admin-bars">
                                    {types.map(([type, count]) => (
                                        <li key={type}>
                                            <span>{gameName(type)}</span>
                                            <div className="admin-bar" aria-hidden="true">
                                                <i style={{width: `${(count / topCount) * 100}%`}}/>
                                            </div>
                                            <strong>{count}</strong>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="page-card">
                            <h2>Latest games</h2>

                            {stats.recentGames.length === 0 ? (
                                <p className="page-note">Nothing yet.</p>
                            ) : (
                                <div className="table-scroll">
                                    <table className="data-table admin-compact">
                                        <thead>
                                            <tr>
                                                <th>Player</th>
                                                <th>Game</th>
                                                <th>WPM</th>
                                                <th>When</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentGames.map((game) => (
                                                <tr key={game.id}>
                                                    <td>{game.username}</td>
                                                    <td>{gameName(game.gameType)}</td>
                                                    <td>{game.wpm ?? '—'}</td>
                                                    <td>{formatDate(game.playedAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </>
            )}
        </AdminShell>
    );
}

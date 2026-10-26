import {useCallback, useEffect, useState} from 'react';

import PageHeader from '../components/PageHeader';
import {EmptyState, ErrorState, LoadingRows} from '../components/PageStates';
import {useAuth} from '../context/AuthContext';
import {leaderboardService} from '../services/gameService';
import {rankTitle} from '../utils/progression';
import '../styles/Pages.css';

const MEDALS = {1: '🥇', 2: '🥈', 3: '🥉'};

export default function LeaderboardPage() {
    const {authRequest} = useAuth();

    const [rows, setRows] = useState([]);
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [top, myRank] = await Promise.all([
                leaderboardService.getTop(authRequest),
                leaderboardService.getMyRank(authRequest),
            ]);

            setRows(Array.isArray(top) ? top : []);
            setMe(myRank);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load the leaderboard.');
        } finally {
            setLoading(false);
        }
    }, [authRequest]);

    useEffect(() => {
        load();
    }, [load]);

    const meInList = rows.some((row) => row.currentUser);

    return (
        <main className="dashboard">
            <PageHeader section="Leaderboard"/>

            <section className="welcome-section">
                <div>
                    <div className="eyebrow">GLOBAL RANKINGS</div>
                    <h1>Climb the <span>leaderboard.</span></h1>
                    <p>Top 100 players ranked by total XP.</p>
                </div>

                {me && (
                    <div className="level-badge">
                        <span className="level-symbol">#{me.rank}</span>
                        <div>
                            <small>YOUR RANK</small>
                            <strong>{me.totalXp.toLocaleString()} XP</strong>
                        </div>
                    </div>
                )}
            </section>

            <section className="page-card">
                {loading && <LoadingRows count={8}/>}

                {!loading && error && <ErrorState message={error} onRetry={load}/>}

                {!loading && !error && rows.length === 0 && (
                    <EmptyState
                        icon="♜"
                        title="No players ranked yet"
                        text="Be the first to earn XP."
                    />
                )}

                {!loading && !error && rows.length > 0 && (
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Level</th>
                                <th>Title</th>
                                <th>XP</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.rank}
                                    className={row.currentUser ? 'row-me' : undefined}
                                >
                                    <td>{MEDALS[row.rank] ?? `#${row.rank}`}</td>
                                    <td>
                                        {row.username}
                                        {row.currentUser && (
                                            <span className="you-tag">YOU</span>
                                        )}
                                    </td>
                                    <td>{row.level}</td>
                                    <td>{rankTitle(row.level)}</td>
                                    <td>{row.totalXp.toLocaleString()}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && me && !meInList && (
                    <p className="page-note">
                        You are ranked <strong>#{me.rank}</strong> with{' '}
                        {me.totalXp.toLocaleString()} XP. Keep playing to reach the top 100!
                    </p>
                )}
            </section>
        </main>
    );
}

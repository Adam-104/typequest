import {useCallback, useEffect, useMemo, useState} from 'react';

import PageHeader from '../components/PageHeader';
import {ErrorState, LoadingRows} from '../components/PageStates';
import {useAuth} from '../context/AuthContext';
import {achievementService} from '../services/gameService';
import '../styles/Pages.css';

export default function AchievementsPage() {
    const {authRequest} = useAuth();

    const [all, setAll] = useState([]);
    const [mine, setMine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [available, unlocked] = await Promise.all([
                achievementService.getAll(authRequest),
                achievementService.getMine(authRequest),
            ]);

            setAll(Array.isArray(available) ? available : []);
            setMine(Array.isArray(unlocked) ? unlocked : []);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load achievements.');
        } finally {
            setLoading(false);
        }
    }, [authRequest]);

    useEffect(() => {
        load();
    }, [load]);

    const unlockedByCode = useMemo(
        () => new Map(mine.map((item) => [item.code, item])),
        [mine],
    );

    return (
        <main className="dashboard">
            <PageHeader section="Achievements"/>

            <section className="welcome-section">
                <div>
                    <div className="eyebrow">YOUR MILESTONES</div>
                    <h1>Earn your <span>achievements.</span></h1>
                    <p>
                        {loading || error
                            ? 'Track your milestones as you progress.'
                            : `${mine.length} of ${all.length} unlocked.`}
                    </p>
                </div>
            </section>

            <section className="page-card">
                {loading && <LoadingRows count={4}/>}

                {!loading && error && <ErrorState message={error} onRetry={load}/>}

                {!loading && !error && (
                    <ul className="achievement-grid">
                        {all.map((achievement) => {
                            const unlocked = unlockedByCode.get(achievement.code);

                            return (
                                <li
                                    key={achievement.code}
                                    className={
                                        unlocked
                                            ? 'achievement-card unlocked'
                                            : 'achievement-card locked'
                                    }
                                >
                                    <span className="achievement-icon" aria-hidden="true">
                                        {unlocked ? achievement.icon : '🔒'}
                                    </span>
                                    <div>
                                        <strong>{achievement.name}</strong>
                                        <p>{achievement.description}</p>
                                        <small>
                                            {unlocked
                                                ? `Unlocked ${new Date(unlocked.unlockedAt).toLocaleDateString()} · +${achievement.xpReward} XP`
                                                : `Reward: ${achievement.xpReward} XP`}
                                        </small>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </main>
    );
}

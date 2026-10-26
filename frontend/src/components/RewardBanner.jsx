import {Link} from 'react-router-dom';

import '../styles/Pages.css';

// Shows what a finished game earned: XP, level-ups and new achievements.
export default function RewardBanner({submission, onRetry}) {
    if (!submission || submission.status === 'idle') {
        return null;
    }

    if (submission.status === 'guest') {
        return (
            <div className="reward-banner reward-guest" role="status">
                <strong>Nice run! This one isn't saved.</strong>
                <span>
                    Create a free account to keep your scores, earn XP and climb the leaderboard.
                </span>
                <span className="reward-guest-actions">
                    <Link to="/register">Create account</Link>
                    <Link to="/login">Log in</Link>
                </span>
            </div>
        );
    }

    if (submission.status === 'saving') {
        return (
            <div className="reward-banner" role="status">
                <span className="reward-spinner" aria-hidden="true"/>
                Saving your result…
            </div>
        );
    }

    if (submission.status === 'error') {
        return (
            <div className="reward-banner reward-error" role="alert">
                <span>{submission.error}</span>
                {onRetry && (
                    <button type="button" onClick={onRetry}>
                        Retry
                    </button>
                )}
            </div>
        );
    }

    const reward = submission.reward;
    const achievements = reward.unlockedAchievements ?? [];

    return (
        <div className="reward-banner reward-success" role="status">
            <div className="reward-main">
                <strong className="reward-xp">+{reward.earnedXp} XP</strong>
                <span>
                    Level {reward.level} · {reward.totalXp.toLocaleString()} XP
                </span>
                {reward.levelUp && (
                    <span className="reward-levelup">LEVEL UP!</span>
                )}
            </div>

            {achievements.length > 0 && (
                <ul className="reward-achievements">
                    {achievements.map((achievement) => (
                        <li key={achievement.code}>
                            <span aria-hidden="true">{achievement.icon}</span>
                            <div>
                                <strong>{achievement.name}</strong>
                                <small>
                                    {achievement.description} · +
                                    {achievement.xpReward} XP
                                </small>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

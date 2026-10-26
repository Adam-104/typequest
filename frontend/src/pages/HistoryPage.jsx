import {NavLink} from 'react-router-dom';

import PageHeader from '../components/PageHeader';
import {EmptyState, ErrorState, LoadingRows} from '../components/PageStates';
import {usePlayer} from '../context/PlayerContext';
import {GAME_LABELS} from '../utils/progression';
import '../styles/Pages.css';

function formatDate(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
}

export default function HistoryPage() {
    const {history, loading, error, reload, profile} = usePlayer();

    const initialLoad = loading && !profile && history.length === 0;

    return (
        <main className="dashboard">
            <PageHeader section="History"/>

            <section className="welcome-section">
                <div>
                    <div className="eyebrow">YOUR TYPING JOURNEY</div>
                    <h1>Your game <span>history.</span></h1>
                    <p>Every game you finish is saved to your account.</p>
                </div>
            </section>

            <section className="page-card">
                <h2>Completed games ({history.length})</h2>

                {initialLoad && <LoadingRows/>}

                {!initialLoad && error && (
                    <ErrorState message={error} onRetry={reload}/>
                )}

                {!initialLoad && !error && history.length === 0 && (
                    <EmptyState
                        icon="⌨"
                        title="No games yet"
                        text="Finish a game and your results will show up here."
                    >
                        <NavLink className="primary-button" to="/games">
                            Play a game →
                        </NavLink>
                    </EmptyState>
                )}

                {!initialLoad && !error && history.length > 0 && (
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Date &amp; time</th>
                                <th>Game</th>
                                <th>Speed</th>
                                <th>Accuracy</th>
                                <th>Score</th>
                                <th>Duration</th>
                            </tr>
                            </thead>
                            <tbody>
                            {history.map((game) => (
                                <tr key={game.id}>
                                    <td>{formatDate(game.playedAt)}</td>
                                    <td>{GAME_LABELS[game.gameType] ?? game.gameType}</td>
                                    <td>{Math.round(game.wpm)} WPM</td>
                                    <td>{Math.round(game.accuracy)}%</td>
                                    <td>{game.score}</td>
                                    <td>{game.durationSeconds}s</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

import './App.css';
import './styles/mobile-nav.css';
import {useEffect, useRef, useState} from 'react';
import {Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams} from 'react-router-dom';
import {useAuth} from './context/AuthContext';
import {usePlayer} from './context/PlayerContext';
import ConfirmDialog from './components/ConfirmDialog';
import PageHeader from './components/PageHeader';
import StatCard from './components/StatCard';
import HistoryPage from './pages/HistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AchievementsPage from './pages/AchievementsPage';
import LearnPage from './pages/LearnPage';
import LessonPage from './pages/LessonPage';
import PracticePage from './pages/PracticePage';
import SettingsPage from './pages/SettingsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import {PrivacyPage, TermsPage} from './pages/LegalPage';
import {getAllLessons, getNextLesson} from './data/curriculum';
import {levelProgress, rankTitle, summarizeHistory, weekActivity} from './utils/progression';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminScores from './pages/admin/AdminScores';
import AdminContent from './pages/admin/AdminContent';
import {useLessonProgress} from './context/LessonProgressContext';
import Login from './pages/Login';
import Register from './pages/Register';
import WelcomePage from './pages/WelcomePage';
import ResetPassword from './pages/ResetPassword';
import TypingSpeedGame from './components/games/TypingSpeedGame';
import TypingRacerGame from './components/games/TypingRacerGame';
import WordSurvivalGame from './components/games/WordSurvivalGame';
import SpaceMissionGame from './components/games/SpaceMissionGame';
import NinjaWordStrikeGame from './components/games/NinjaWordStrikeGame';


const games = [
    {
        id: 1,
        name: 'Typing Speed',
        category: 'speed challenge',
        description: 'Push your WPM to the next level.',
        glyph: 'wpm',
        color: 'purple',
        difficulty: 'Beginner',
        duration: '2–5 min',
    },
    {
        id: 2,
        name: 'Typing Racer',
        category: 'racing',
        description: 'Type fast. Race faster. Win the track.',
        glyph: 'vs',
        color: 'blue',
        difficulty: 'Intermediate',
        duration: '3–5 min',
    },
    {
        id: 3,
        name: 'Word Survival',
        category: 'survival',
        description: 'Defeat approaching words before time runs out.',
        glyph: 'hp',
        color: 'red',
        difficulty: 'Intermediate',
        duration: '5–8 min',
    },
    {
        id: 4,
        name: 'Space Mission',
        category: 'adventure',
        description: 'Power your spaceship with perfect typing.',
        glyph: 'go',
        color: 'cyan',
        difficulty: 'Beginner',
        duration: '3–6 min',
    },
    {
        id: 5,
        name: 'Ninja Word Strike',
        category: 'arcade',
        description: 'Strike targets with lightning-fast typing.',
        glyph: '↯',
        color: 'orange',
        difficulty: 'Advanced',
        duration: '4–7 min',
    },
];

const navigation = [
    { icon: '⌂', label: 'Overview', path: '/' },
    { icon: '▤', label: 'Learn', path: '/learn' },
    { icon: '▣', label: 'Play Games', path: '/games' },
    { icon: '⌨', label: 'Practice', path: '/practice' },
    { icon: '◷', label: 'History', path: '/history' },
    { icon: '♜', label: 'Leaderboard', path: '/leaderboard' },
    { icon: '◇', label: 'Achievements', path: '/achievements' },
    { icon: '⚙', label: 'Settings', path: '/settings' },
];


const adminNavigation = {icon: '✎', label: 'Admin', path: '/admin'};


// One place for "log out": a themed confirm dialog, then back to the login page.
// `ask()` opens it; render `dialog` somewhere in the component.
function useLogoutDialog() {
    const {logout} = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    async function confirm() {
        if (busy) {
            return;
        }

        setBusy(true);

        try {
            await logout();
            setOpen(false);
            navigate('/login', {replace: true});
        } catch {
            setBusy(false);
        }
    }

    const dialog = open ? (
        <ConfirmDialog
            title="Log out of TypeQuest?"
            confirmLabel="Log out"
            busyLabel="Logging out…"
            busy={busy}
            onConfirm={confirm}
            onCancel={() => setOpen(false)}
        >
            Your progress is saved. You can sign back in anytime.
        </ConfirmDialog>
    ) : null;

    return {ask: () => setOpen(true), dialog};
}

function ProfileSection() {
    const {user} = useAuth();
    const {ask, dialog} = useLogoutDialog();

    const username = user?.username || 'Player';

    return (
        <div className="profile-section">
            <div className="profile-button">
                <div className="avatar">{username.charAt(0).toUpperCase()}</div>
                <span className="profile-info">
                    <strong>{username}</strong>
                    <small>{user?.email || 'TypeQuest Player'}</small>
                </span>
            </div>

            <button className="game-play-button" type="button" onClick={ask}>
                Log out <span>→</span>
            </button>

            {dialog}
        </div>
    );
}

function Sidebar() {
    const {isAdmin} = useAuth();
    const {history} = usePlayer();
    const week = weekActivity(history);
    const items = isAdmin ? [...navigation, adminNavigation] : navigation;

    return (
        <aside className="sidebar">
            <NavLink className="brand" to="/" aria-label="TypeQuest home">
                <span className="brand-icon">T</span>
                <span>
          <strong>typequest</strong>
          <small>learn to type, properly</small>
        </span>
            </NavLink>

            <div className="sidebar-label">MENU</div>

            <nav className="navigation" aria-label="Main navigation">
                {items.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        end={item.path === '/'}
                        className={({isActive}) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-label">YOUR JOURNEY</div>

                <div className="journey-card">
                    <strong>Keep the streak alive</strong>
                    <p>A little practice every day makes a big difference.</p>

                    <div className="streak-days" aria-label="Days you played this week">
                        {week.map((day, index) => (
                            <span
                                key={index}
                                className={day.played ? 'completed' : undefined}
                                title={day.today ? 'Today' : undefined}
                            >
                                {day.letter}
                            </span>
                        ))}
                    </div>
                </div>

                <ProfileSection/>

                <nav className="sidebar-legal" aria-label="Legal">
                    <NavLink to="/privacy">Privacy</NavLink>
                    <NavLink to="/terms">Terms</NavLink>
                </nav>
            </div>
        </aside>
    );
}


// Phones and small tablets: the sidebar is hidden and this takes over. Four
// labelled tabs for what people use most, and a Menu sheet for everything else
// (including the account and Log out).
const TAB_PATHS = ['/', '/learn', '/games', '/practice'];

function MobileNav() {
    const {user, isAdmin} = useAuth();
    const {pathname} = useLocation();
    const {ask, dialog} = useLogoutDialog();
    const [open, setOpen] = useState(false);
    const closeRef = useRef(null);

    const tabs = navigation.filter((item) => TAB_PATHS.includes(item.path));
    const more = [
        ...navigation.filter((item) => !TAB_PATHS.includes(item.path)),
        ...(isAdmin ? [adminNavigation] : []),
    ];
    const username = user?.username || 'Player';
    const menuActive = more.some((item) => pathname.startsWith(item.path));

    // Going to another page closes the sheet.
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        closeRef.current?.focus();

        function onKey(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('keydown', onKey);
        document.body.classList.add('mnav-lock');

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.classList.remove('mnav-lock');
        };
    }, [open]);

    return (
        <>
            <nav className="mnav" aria-label="Main navigation">
                {tabs.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({isActive}) => `mnav-tab ${isActive ? 'active' : ''}`}
                    >
                        <span className="mnav-icon" aria-hidden="true">{item.icon}</span>
                        <span className="mnav-label">{item.path === '/' ? 'Home' : item.label.replace('Play ', '')}</span>
                    </NavLink>
                ))}

                <button
                    type="button"
                    className={`mnav-tab ${menuActive || open ? 'active' : ''}`}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={() => setOpen((value) => !value)}
                >
                    <span className="mnav-icon" aria-hidden="true">☰</span>
                    <span className="mnav-label">Menu</span>
                </button>
            </nav>

            {open && (
                <div className="msheet-backdrop" onClick={() => setOpen(false)}>
                    <div
                        className="msheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="msheet-head">
                            <div className="avatar">{username.charAt(0).toUpperCase()}</div>
                            <span className="msheet-who">
                                <strong>{username}</strong>
                                <small>{user?.email || 'TypeQuest Player'}</small>
                            </span>
                            <button
                                ref={closeRef}
                                type="button"
                                className="msheet-close"
                                aria-label="Close menu"
                                onClick={() => setOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="msheet-links">
                            {more.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({isActive}) => `msheet-link ${isActive ? 'active' : ''}`}
                                >
                                    <span className="msheet-icon" aria-hidden="true">{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="msheet-logout"
                            onClick={() => {
                                setOpen(false);
                                ask();
                            }}
                        >
                            Log out <span aria-hidden="true">→</span>
                        </button>

                        <div className="msheet-legal">
                            <NavLink to="/privacy">Privacy</NavLink>
                            <NavLink to="/terms">Terms</NavLink>
                        </div>
                    </div>
                </div>
            )}

            {dialog}
        </>
    );
}


function FeaturedGame() {
    const navigate = useNavigate();

    return (
        <section className="featured-game" aria-labelledby="featured-title">
            <div className="featured-content">
                <div className="featured-tag">
                    <span className="live-dot"/>
                    YOUR NEXT CHALLENGE
                </div>

                <h2 id="featured-title">
                    Every keystroke
                    <br/>
                    takes you <span>further.</span>
                </h2>

                <p>
                    Sharpen your skills, beat your personal records, and become the
                    ultimate typing champion.
                </p>

                <button
                    className="primary-button"
                    type="button"
                    onClick={() => navigate('/games')}
                >
                    Explore games <span>↗</span>
                </button>

                <div className="featured-meta">
                    <span>✦ 5 GAME MODES</span>
                    <span>◷ PLAY ANYTIME</span>
                </div>
            </div>

            <div className="featured-art" aria-hidden="true">
                <div className="orbit orbit-one"/>
                <div className="orbit orbit-two"/>
                <div className="hero-glow"/>
                <div className="hero-key key-one">W</div>
                <div className="hero-key key-two">P</div>
                <div className="hero-key key-three">↵</div>

                <div className="hero-core">
                    <span className="core-symbol">T</span>
                    <span className="core-label">TYPEQUEST</span>
                </div>

                <div className="floating-xp">+XP</div>
            </div>
        </section>
    );
}

function GameCard({ game }) {
    const navigate = useNavigate();

    const gameRoutes = {
        1: '/games/typing-speed',
        2: '/games/typing-racer',
        3: '/games/word-survival',
        4: '/games/space-mission',
        5: '/games/ninja-word-strike',
    };

    const available = Boolean(gameRoutes[game.id]);

    function handlePlay() {
        if (available) {
            navigate(gameRoutes[game.id]);
        }
    }

    return (
        <article className="game-card">
            <div className={`game-art ${game.color}`}>
                <span className="game-category">{game.category}</span>

                <span className="game-art-icon" aria-hidden="true">
                    {game.glyph}
                </span>

                <span className="art-decoration" aria-hidden="true">
                    ✦
                </span>
            </div>

            <div className="game-details">
                <div className="game-heading">
                    <h3>{game.name}</h3>
                    <span className="game-arrow" aria-hidden="true">
                        ↗
                    </span>
                </div>

                <p>{game.description}</p>

                <div className="game-footer">
                    <span>{game.difficulty}</span>
                    <span>◷ {game.duration}</span>
                </div>

                <button
                    className="game-play-button"
                    type="button"
                    disabled={!available}
                    onClick={handlePlay}
                >
                    {available ? 'Play now' : 'Coming soon'}
                    {available && <span>→</span>}
                </button>
            </div>
        </article>
    );
}


function GamesGrid() {
    return (
        <div className="games-grid">
            {games.map((game) => (
                <GameCard key={game.id} game={game}/>
            ))}
        </div>
    );
}

function LevelProgress() {
    const {profile} = usePlayer();

    const totalXp = profile?.totalXp ?? 0;
    const level = profile?.level ?? 1;
    const progress = levelProgress(totalXp, level);

    return (
        <section className="level-progress" aria-label="Level progression">
            <div className="progress-top">
                <div>
                    <span className="progress-label">LEVEL PROGRESSION</span>
                    <h3>
                        {rankTitle(level)} <span>· Level {level}</span>
                    </h3>
                </div>

                <div className="xp-next">
                    <strong>{totalXp.toLocaleString()} XP</strong>
                    <span>
                        {progress.end.toLocaleString()} XP to level {level + 1}
                    </span>
                </div>
            </div>

            <div
                className="progress-track"
                role="progressbar"
                aria-label={`Progress toward level ${level + 1}`}
                aria-valuenow={Math.round(progress.percent)}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div className="progress-fill" style={{width: `${progress.percent}%`}}/>
            </div>

            <div className="progress-bottom">
                <span>LEVEL {level}</span>
                <span>{progress.remaining} XP TO NEXT LEVEL</span>
            </div>
        </section>
    );
}

function ContinueLearningCard() {
    const navigate = useNavigate();
    const { progress } = useLessonProgress();

    const lessons = getAllLessons();
    const completedCount = lessons.filter(
        (lesson) => progress[lesson.id]?.completed,
    ).length;

    const nextLesson = getNextLesson(progress);
    const percentage = lessons.length
        ? Math.round((completedCount / lessons.length) * 100)
        : 0;

    return (
        <section className="continue-learning-card">
            <div className="continue-learning-icon">⌨</div>

            <div className="continue-learning-content">
                <span className="eyebrow">YOUR LEARNING PATH</span>

                <h2>
                    {nextLesson
                        ? 'Continue learning'
                        : 'You completed the course!'}
                </h2>

                <p>
                    {nextLesson
                        ? `Next up: ${nextLesson.title}`
                        : 'Amazing work. Revisit any lesson to keep improving.'}
                </p>

                <div className="continue-learning-progress">
                    <span style={{ width: `${percentage}%` }} />
                </div>

                <div className="continue-learning-meta">
                    {completedCount} of {lessons.length} lessons · {percentage}% complete
                </div>
            </div>

            <button
                className="primary-button"
                type="button"
                onClick={() =>
                    navigate(
                        nextLesson
                            ? `/learn/lesson/${nextLesson.id}`
                            : '/learn',
                    )
                }
            >
                {nextLesson ? 'Continue' : 'Review lessons'} <span>→</span>
            </button>
        </section>
    );
}

function Dashboard() {
    const {user} = useAuth();
    const {profile, history, loading, error, reload} = usePlayer();
    const username = user?.username || 'Player';

    const summary = summarizeHistory(history);
    const level = profile?.level ?? 1;
    const hasGames = history.length > 0;

    return (
        <main className="dashboard" id="home">
            <PageHeader section="Overview"/>

            <section className="welcome-section">
                <div>
                    <div className="eyebrow">YOUR NEXT LEVEL AWAITS</div>
                    <h1>
                        Ready to level up, <span>{username}?</span>
                    </h1>
                    <p>Your next personal best is just a few keystrokes away.</p>
                </div>

                <div className="level-badge">
                    <span className="level-symbol">✦</span>
                    <div>
                        <small>YOUR RANK</small>
                        <strong>{rankTitle(level)}</strong>
                    </div>
                </div>
            </section>

            {error && (
                <div className="reward-banner reward-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={reload}>Retry</button>
                </div>
            )}

            <section
                className="stats-grid"
                aria-label="Player statistics"
                aria-busy={loading && !profile}
            >
                <StatCard
                    icon="⌨"
                    label="BEST SPEED"
                    value={hasGames ? summary.bestWpm : '—'}
                    unit={hasGames ? ' WPM' : ''}
                    detail={
                        hasGames
                            ? `Average of last games: ${summary.avgWpm} WPM`
                            : 'Play a game to set your first record'
                    }
                    color="purple"
                />

                <StatCard
                    icon="◎"
                    label="ACCURACY"
                    value={hasGames ? summary.avgAccuracy : '—'}
                    unit={hasGames ? '%' : ''}
                    detail={
                        hasGames
                            ? 'Average of your last 10 games'
                            : 'Accuracy appears after your first game'
                    }
                    color="green"
                />

                <StatCard
                    icon="⚡"
                    label="TOTAL XP"
                    value={(profile?.totalXp ?? 0).toLocaleString()}
                    detail={`Level ${level} · ${profile?.gamesPlayed ?? 0} games played`}
                    color="orange"
                />

                <StatCard
                    icon="♨"
                    label="DAY STREAK"
                    value={summary.streak}
                    unit={summary.streak === 1 ? ' day' : ' days'}
                    detail={
                        summary.streak > 0
                            ? 'Keep your streak going'
                            : 'Play today to start a streak'
                    }
                    color="blue"
                />
            </section>

            <ContinueLearningCard/>

            <LevelProgress/>

            <FeaturedGame/>

            <section className="games-section" id="play-games">
                <div className="section-heading">
                    <div>
                        <div className="eyebrow">FIND YOUR NEXT CHALLENGE</div>
                        <h2>
                            Choose your game<span>.</span>
                        </h2>
                        <p>Every game is a new way to sharpen your skills.</p>
                    </div>

                    <NavLink className="text-button" to="/games">
                        All games <span>→</span>
                    </NavLink>
                </div>

                <GamesGrid/>
            </section>

            <footer className="dashboard-footer">
        <span>
          TYPEQUEST <span className="footer-dot">●</span> YOUR NEXT LEVEL STARTS
          HERE
        </span>
                <span>MADE FOR EVERY KEYSTROKE ✦</span>
            </footer>
        </main>
    );
}

function GamesPage() {
    return (
        <main className="dashboard">
            <PageHeader section="Play Games"/>

            <section className="welcome-section">
                <div>
                    <div className="eyebrow">YOUR NEXT CHALLENGE STARTS HERE</div>
                    <h1>
                        Choose your <span>game.</span>
                    </h1>
                    <p>Explore typing challenges and find your next personal best.</p>
                </div>
            </section>

            <section className="games-section">
                <div className="section-heading">
                    <div>
                        <div className="eyebrow">GAME LIBRARY</div>
                        <h2>
                            All games<span>.</span>
                        </h2>
                        <p>Choose a game to start improving your typing skills.</p>
                    </div>
                </div>

                <GamesGrid/>
            </section>
        </main>
    );
}

function ProtectedLayout({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <h2>Loading TypeQuest...</h2>
                <p>Preparing your typing adventure.</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="app-shell">
            <Sidebar />
            {children}
            <MobileNav />
        </div>
    );
}

// Auth guard for full-screen pages that do not use the sidebar layout.
function ProtectedRoute({children}) {
    const {isAuthenticated, loading} = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <h2>Loading TypeQuest...</h2>
                <p>Preparing your typing adventure.</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    return children;
}

// Pages only admins may open. The server checks the role again on every call.
function AdminRoute({children}) {
    const {isAdmin, loading} = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <h2>Loading TypeQuest...</h2>
            </div>
        );
    }

    return <ProtectedLayout>{isAdmin ? children : <Navigate to="/" replace/>}</ProtectedLayout>;
}

// Pages anyone may try before signing up. Results are not saved for guests.
function TryRoute({children}) {
    const {loading} = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <h2>Loading TypeQuest...</h2>
                <p>Preparing your typing adventure.</p>
            </div>
        );
    }

    return children;
}

// The sidebar pages need an account; visitors go back to the welcome page.
function MemberLayout({children}) {
    const {isAuthenticated, loading} = useAuth();

    if (!loading && !isAuthenticated) return <Navigate to="/" replace/>;

    return <ProtectedLayout>{children}</ProtectedLayout>;
}

// The home page: the dashboard for players, the welcome page for visitors.
function HomeRoute() {
    const {isAuthenticated, loading} = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <h2>Loading TypeQuest...</h2>
                <p>Preparing your typing adventure.</p>
            </div>
        );
    }

    if (!isAuthenticated) return <WelcomePage/>;

    return <ProtectedLayout><Dashboard/></ProtectedLayout>;
}

function GuestRoute({children}) {
    const {isAuthenticated, loading} = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <h2>Loading TypeQuest...</h2>
                <p>Preparing your typing adventure.</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace/>;
    }

    return children;
}

function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <Login/>
                    </GuestRoute>
                }
            />

            <Route
                path="/register"
                element={
                    <GuestRoute>
                        <Register/>
                    </GuestRoute>
                }
            />


            <Route path="/" element={<HomeRoute/>}/>

            <Route
                path="/games"
                element={
                    <MemberLayout>
                        <GamesPage/>
                    </MemberLayout>
                }
            />

            <Route
                path="/games/typing-speed"
                element={
                    <TryRoute>
                        <TypingSpeedGame />
                    </TryRoute>
                }
            />

            <Route
                path="/games/typing-racer"
                element={
                    <TryRoute>
                        <TypingRacerGame />
                    </TryRoute>
                }
            />

            <Route
                path="/games/word-survival"
                element={
                    <TryRoute>
                        <WordSurvivalGame />
                    </TryRoute>
                }
            />

            <Route
                path="/games/space-mission"
                element={
                    <TryRoute>
                        <SpaceMissionGame />
                    </TryRoute>
                }
            />

            <Route
                path="/games/ninja-word-strike"
                element={
                    <TryRoute>
                        <NinjaWordStrikeGame />
                    </TryRoute>
                }
            />

            <Route
                path="/learn"
                element={
                    <MemberLayout>
                        <LearnPage/>
                    </MemberLayout>
                }
            />

            <Route
                path="/learn/lesson/:lessonId"
                element={
                    <TryRoute>
                        <LessonPage/>
                    </TryRoute>
                }
            />

            <Route
                path="/practice"
                element={
                    <TryRoute>
                        <PracticePage/>
                    </TryRoute>
                }
            />

            <Route path="/admin" element={<AdminRoute><AdminOverview/></AdminRoute>}/>
            <Route path="/admin/users" element={<AdminRoute><AdminUsers/></AdminRoute>}/>
            <Route path="/admin/scores" element={<AdminRoute><AdminScores/></AdminRoute>}/>
            <Route path="/admin/content" element={<AdminRoute><AdminContent/></AdminRoute>}/>

            <Route
                path="/history"
                element={
                    <MemberLayout>
                        <HistoryPage />
                    </MemberLayout>
                }
            />

            <Route
                path="/leaderboard"
                element={
                    <MemberLayout>
                        <LeaderboardPage/>
                    </MemberLayout>
                }
            />

            <Route
                path="/achievements"
                element={
                    <MemberLayout>
                        <AchievementsPage/>
                    </MemberLayout>
                }
            />

            <Route
                path="/settings"
                element={
                    <MemberLayout>
                        <SettingsPage/>
                    </MemberLayout>
                }
            />

            <Route
                path="/reset-password"
                element={<ResetPassword/>}
            />

            <Route path="/verify-email" element={<VerifyEmailPage/>}/>
            <Route path="/privacy" element={<PrivacyPage/>}/>
            <Route path="/terms" element={<TermsPage/>}/>

            <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
    );
}

export default App;
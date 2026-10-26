import {useNavigate} from 'react-router-dom';

import PageHeader from '../components/PageHeader';
import {ErrorState, LoadingRows} from '../components/PageStates';
import {useLessonProgress} from '../context/LessonProgressContext';
import {getAllLessons, getNextLesson, learningLevels} from '../data/curriculum';
import {starsForProgress} from '../utils/lessonGrade';
import '../styles/Pages.css';
import '../styles/learn.css';

function Stars({count}) {
    return (
        <span className="lp-stars" role="img" aria-label={`${count} of 3 stars`}>
            {[1, 2, 3].map((n) => (n <= count ? '★' : <i key={n}>★</i>))}
        </span>
    );
}

export default function LearnPage() {
    const navigate = useNavigate();
    const {progress, loading, error, loadProgress} = useLessonProgress();

    const lessons = getAllLessons();
    const completed = lessons.filter((lesson) => progress[lesson.id]?.completed).length;
    const percent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
    const next = getNextLesson(progress);
    const open = (lesson) => navigate(`/learn/lesson/${lesson.id}`);

    return (
        <main className="dashboard">
            <PageHeader section="Learn"/>

            <section className="welcome-section">
                <div>
                    <div className="eyebrow">Your learning path</div>
                    <h1>Learn to touch type.</h1>
                    <p>Eight levels from finger placement to full paragraphs. Pass a lesson with {85}% accuracy to move on.</p>
                </div>
            </section>

            {error && !loading && Object.keys(progress).length === 0 ? (
                <ErrorState message={error} onRetry={loadProgress}/>
            ) : loading && Object.keys(progress).length === 0 ? (
                <LoadingRows count={4}/>
            ) : (
                <>
                    <section className="lp-hero" aria-label="Your progress">
                        <div className="lp-hero-main">
                            <span className="eyebrow">{next ? 'Up next' : 'Course complete'}</span>
                            <h2>{next ? next.title : 'You finished every lesson.'}</h2>
                            <p>
                                {next
                                    ? `${next.levelTitle} · ${next.duration} · ${next.description}`
                                    : 'Replay any lesson to beat your best, or head to Practice for drills.'}
                            </p>

                            <div
                                className="lp-bar"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={percent}
                                aria-label="Course progress"
                            >
                                <span style={{width: `${percent}%`}}/>
                            </div>
                            <div className="lp-hero-meta">
                                {completed} of {lessons.length} lessons · {percent}% complete
                            </div>
                        </div>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => (next ? open(next) : navigate('/practice'))}
                        >
                            {next ? (completed ? 'Continue' : 'Start learning') : 'Go to practice'} <span>→</span>
                        </button>
                    </section>

                    <div className="lp-levels">
                        {learningLevels.map((level) => {
                            const done = level.lessons.filter((lesson) => progress[lesson.id]?.completed).length;

                            return (
                                <section className="lp-level" key={level.id} aria-labelledby={`level-${level.id}`}>
                                    <div className="lp-level-head">
                                        <h3 id={`level-${level.id}`}>Level {level.id} · {level.title}</h3>
                                        <span className="lp-level-count">{done} of {level.lessons.length} done</span>
                                    </div>
                                    <p>{level.description}</p>

                                    <ul className="lp-lessons">
                                        {level.lessons.map((lesson) => {
                                            const entry = progress[lesson.id];
                                            const isNext = next?.id === lesson.id;

                                            return (
                                                <li key={lesson.id}>
                                                    <button
                                                        type="button"
                                                        className={`lp-lesson${isNext ? ' is-next' : ''}`}
                                                        onClick={() => open(lesson)}
                                                    >
                                                        <span className="lp-lesson-top">
                                                            <span>{lesson.id}</span>
                                                            {isNext
                                                                ? <span className="lp-tag">Next</span>
                                                                : entry?.completed
                                                                    ? <Stars count={starsForProgress(entry)}/>
                                                                    : <span>{lesson.duration}</span>}
                                                        </span>
                                                        <strong>{lesson.title}</strong>
                                                        <small>
                                                            {entry?.completed
                                                                ? `Best ${entry.bestWpm} WPM · ${entry.accuracy}%`
                                                                : lesson.description}
                                                        </small>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            );
                        })}
                    </div>
                </>
            )}
        </main>
    );
}

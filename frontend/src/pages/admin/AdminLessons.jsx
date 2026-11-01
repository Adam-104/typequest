import {useState} from 'react';

import AdminShell from '../../components/AdminShell';
import {useAuth} from '../../context/AuthContext';
import {useCurriculum} from '../../context/CurriculumContext';
import {getExercise, getWords} from '../../data/curriculum';
import {adminService} from '../../services/adminService';

// The fields an admin can change. A lesson's id and level never change,
// because players' saved progress points at the id.
const FIELDS = [
    {key: 'title', label: 'Title', max: 100},
    {key: 'duration', label: 'Duration (like 5 min)', max: 20},
    {key: 'description', label: 'Short description', max: 500, wide: true},
    {key: 'heading', label: 'Exercise heading', max: 150},
    {key: 'instruction', label: 'Instruction', max: 500, wide: true},
    {key: 'tip', label: 'Tip', max: 500, wide: true},
    {key: 'target', label: 'Sample text (shown if there are no practice words)', max: 1000, wide: true},
];

function draftFor(lesson) {
    const exercise = getExercise(lesson.id);
    const words = getWords(lesson.id);

    return {
        title: lesson.title,
        duration: lesson.duration,
        description: lesson.description,
        heading: exercise.heading ?? '',
        instruction: exercise.instruction ?? '',
        tip: exercise.tip ?? '',
        target: exercise.target ?? '',
        words: words.join('\n'),
    };
}

export default function AdminLessons() {
    const {authRequest} = useAuth();
    const {levels, source, reload} = useCurriculum();

    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    function open(lesson) {
        setEditingId(lesson.id);
        setDraft(draftFor(lesson));
        setMessage(null);
    }

    function close() {
        setEditingId(null);
        setDraft(null);
    }

    async function save(event) {
        event.preventDefault();
        setBusy(true);
        setMessage(null);

        try {
            await adminService.updateLesson(authRequest, editingId, {
                ...draft,
                words: draft.words.split('\n').map((word) => word.trim()).filter(Boolean),
            });
            await reload();
            setMessage({ok: true, text: `Lesson ${editingId} saved. Players see it right away.`});
            close();
        } catch (error) {
            setMessage({ok: false, text: error.message || 'That did not work.'});
        } finally {
            setBusy(false);
        }
    }

    const wordCount = draft ? draft.words.split('\n').filter((word) => word.trim()).length : 0;

    return (
        <AdminShell
            title="Lessons."
            intro="Edit the lesson text players see. Changes apply right away, with no deploy."
        >
            {source !== 'server' && (
                <p className="admin-message is-error" role="status">
                    The course has not loaded from the server yet. Saving is still possible, but check that the
                    server is awake and refresh before editing.
                </p>
            )}

            {message && (
                <p className={`admin-message${message.ok ? '' : ' is-error'}`} role="status">
                    {message.text}
                </p>
            )}

            {levels.map((level) => (
                <section className="page-card" key={level.id}>
                    <h2>Level {level.id}: {level.title}</h2>

                    <ul className="admin-list">
                        {level.lessons.map((lesson) => (
                            <li key={lesson.id}>
                                <div className="admin-list-main">
                                    <span className="admin-tag">{lesson.id}</span>

                                    {editingId === lesson.id && draft ? (
                                        <form className="admin-form admin-lesson-form" onSubmit={save}>
                                            {FIELDS.map((field) => (
                                                <label key={field.key} className={field.wide ? 'admin-form-wide' : ''}>
                                                    <span>{field.label}</span>
                                                    {field.wide ? (
                                                        <textarea
                                                            rows={2}
                                                            value={draft[field.key]}
                                                            maxLength={field.max}
                                                            onChange={(event) => setDraft({...draft, [field.key]: event.target.value})}
                                                        />
                                                    ) : (
                                                        <input
                                                            value={draft[field.key]}
                                                            maxLength={field.max}
                                                            onChange={(event) => setDraft({...draft, [field.key]: event.target.value})}
                                                        />
                                                    )}
                                                </label>
                                            ))}

                                            <label className="admin-form-wide">
                                                <span>Practice words or phrases, one per line ({wordCount}, up to 80)</span>
                                                <textarea
                                                    rows={6}
                                                    value={draft.words}
                                                    onChange={(event) => setDraft({...draft, words: event.target.value})}
                                                />
                                            </label>

                                            <div className="admin-form-actions">
                                                <button
                                                    type="submit"
                                                    className="admin-primary"
                                                    disabled={busy || wordCount === 0 || wordCount > 80}
                                                >
                                                    Save lesson
                                                </button>
                                                <button type="button" disabled={busy} onClick={close}>Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <p>
                                            <b>{lesson.title}</b> · {lesson.duration}
                                            <br/>
                                            {lesson.description}
                                        </p>
                                    )}
                                </div>

                                {editingId !== lesson.id && (
                                    <div className="admin-actions">
                                        <button type="button" disabled={busy} onClick={() => open(lesson)}>Edit</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </AdminShell>
    );
}

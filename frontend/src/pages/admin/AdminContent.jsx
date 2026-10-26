import {useCallback, useState} from 'react';

import AdminShell from '../../components/AdminShell';
import {ErrorState, LoadingRows} from '../../components/PageStates';
import {useAuth} from '../../context/AuthContext';
import {racePassages, speedPassages} from '../../data/passages';
import useAsync from '../../hooks/useAsync';
import {adminService} from '../../services/adminService';

const CATEGORY_LABEL = {SPEED: 'Typing Speed', RACE: 'Typing Racer'};

export default function AdminContent() {
    return (
        <AdminShell
            title="Content."
            intro="Edit the texts players type and the achievements they unlock."
        >
            <PassageManager/>
            <AchievementEditor/>
        </AdminShell>
    );
}

// ---- Typing texts ----------------------------------------------------------

function PassageManager() {
    const {authRequest} = useAuth();
    const load = useCallback(() => adminService.passages(authRequest), [authRequest]);
    const {data, loading, error, reload} = useAsync(load);

    const [category, setCategory] = useState('SPEED');
    const [text, setText] = useState('');
    const [editing, setEditing] = useState(null); // {id, text}
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    async function run(action, success) {
        setBusy(true);
        setMessage(null);

        try {
            await action();
            setMessage({ok: true, text: success});
            await reload();

            return true;
        } catch (actionError) {
            setMessage({ok: false, text: actionError.message || 'That did not work.'});

            return false;
        } finally {
            setBusy(false);
        }
    }

    async function add(event) {
        event.preventDefault();

        const done = await run(
            () => adminService.createPassage(authRequest, {category, text, active: true}),
            'Text added.',
        );

        if (done) setText('');
    }

    async function saveEdit(row) {
        const done = await run(
            () => adminService.updatePassage(authRequest, row.id, {
                category: row.category,
                text: editing.text,
                active: row.active,
            }),
            'Text saved.',
        );

        if (done) setEditing(null);
    }

    function importBuiltIn() {
        const all = [
            ...speedPassages.map((value) => ({category: 'SPEED', text: value, active: true})),
            ...racePassages.map((value) => ({category: 'RACE', text: value, active: true})),
        ];

        return run(async () => {
            const result = await adminService.importPassages(authRequest, all);

            setMessage({ok: true, text: `Added ${result.added} built-in texts (${result.skipped} were already there).`});
        }, 'Done.').then(() => undefined);
    }

    const rows = data ?? [];
    const activeCount = (name) => rows.filter((row) => row.category === name && row.active).length;
    const length = text.trim().length;

    return (
        <section className="page-card">
            <h2>Typing texts</h2>
            <p className="page-note admin-lead">
                Typing Speed and Typing Racer pick from the active texts below. With none
                active, a game uses its built-in texts.
                {' '}Active now: Speed {activeCount('SPEED')}, Racer {activeCount('RACE')}.
            </p>

            <form className="admin-form" onSubmit={add}>
                <label>
                    <span>Game</span>
                    <select value={category} onChange={(event) => setCategory(event.target.value)}>
                        <option value="SPEED">Typing Speed (long passage)</option>
                        <option value="RACE">Typing Racer (one line)</option>
                    </select>
                </label>

                <label className="admin-form-wide">
                    <span>Text ({length}/1000, at least 20)</span>
                    <textarea
                        rows={3}
                        value={text}
                        maxLength={1000}
                        onChange={(event) => setText(event.target.value)}
                        placeholder="Plain text players will type. Avoid unusual symbols."
                    />
                </label>

                <div className="admin-form-actions">
                    <button type="submit" className="admin-primary" disabled={busy || length < 20}>
                        Add text
                    </button>
                    <button type="button" disabled={busy} onClick={importBuiltIn}>
                        Import built-in texts
                    </button>
                </div>
            </form>

            {message && (
                <p className={`admin-message${message.ok ? '' : ' is-error'}`} role="status">
                    {message.text}
                </p>
            )}

            {error && !data ? (
                <ErrorState message={error} onRetry={reload}/>
            ) : loading && !data ? (
                <LoadingRows count={3}/>
            ) : rows.length === 0 ? (
                <p className="page-note">No custom texts yet. Players see the built-in ones.</p>
            ) : (
                <ul className="admin-list">
                    {rows.map((row) => (
                        <li key={row.id} className={row.active ? '' : 'is-off'}>
                            <div className="admin-list-main">
                                <span className="admin-tag">{CATEGORY_LABEL[row.category] ?? row.category}</span>

                                {editing?.id === row.id ? (
                                    <textarea
                                        rows={3}
                                        value={editing.text}
                                        maxLength={1000}
                                        aria-label="Edit text"
                                        onChange={(event) => setEditing({id: row.id, text: event.target.value})}
                                    />
                                ) : (
                                    <p>{row.text}</p>
                                )}
                            </div>

                            <div className="admin-actions">
                                {editing?.id === row.id ? (
                                    <>
                                        <button
                                            type="button"
                                            className="admin-primary"
                                            disabled={busy || editing.text.trim().length < 20}
                                            onClick={() => saveEdit(row)}
                                        >
                                            Save
                                        </button>
                                        <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => run(
                                                () => adminService.updatePassage(authRequest, row.id, {
                                                    category: row.category,
                                                    text: row.text,
                                                    active: !row.active,
                                                }),
                                                row.active ? 'Text switched off.' : 'Text switched on.',
                                            )}
                                        >
                                            {row.active ? 'Switch off' : 'Switch on'}
                                        </button>
                                        <button type="button" disabled={busy} onClick={() => setEditing({id: row.id, text: row.text})}>
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="is-danger"
                                            disabled={busy}
                                            onClick={() => window.confirm('Delete this text?')
                                                && run(() => adminService.deletePassage(authRequest, row.id), 'Text deleted.')}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

// ---- Achievements ----------------------------------------------------------

function AchievementEditor() {
    const {authRequest} = useAuth();
    const load = useCallback(() => adminService.achievements(authRequest), [authRequest]);
    const {data, loading, error, reload} = useAsync(load);

    return (
        <section className="page-card">
            <h2>Achievements</h2>
            <p className="page-note admin-lead">
                Change how an achievement looks and what it pays. When one unlocks is set by the
                game rules and cannot be changed here.
            </p>

            {error && !data ? (
                <ErrorState message={error} onRetry={reload}/>
            ) : loading && !data ? (
                <LoadingRows count={3}/>
            ) : (
                <ul className="admin-list">
                    {(data ?? []).map((achievement) => (
                        <AchievementRow
                            key={`${achievement.id}-${achievement.name}-${achievement.xpReward}`}
                            achievement={achievement}
                            onSaved={reload}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}

function AchievementRow({achievement, onSaved}) {
    const {authRequest} = useAuth();
    const [form, setForm] = useState({
        name: achievement.name ?? '',
        description: achievement.description ?? '',
        icon: achievement.icon ?? '',
        xpReward: achievement.xpReward ?? 0,
    });
    const [state, setState] = useState({busy: false, message: null});

    const changed = form.name !== (achievement.name ?? '')
        || form.description !== (achievement.description ?? '')
        || form.icon !== (achievement.icon ?? '')
        || Number(form.xpReward) !== achievement.xpReward;

    const set = (field) => (event) => setForm({...form, [field]: event.target.value});

    async function save(event) {
        event.preventDefault();
        setState({busy: true, message: null});

        try {
            await adminService.updateAchievement(authRequest, achievement.id, {
                ...form,
                xpReward: Number(form.xpReward),
            });
            setState({busy: false, message: {ok: true, text: 'Saved.'}});
            onSaved();
        } catch (saveError) {
            setState({busy: false, message: {ok: false, text: saveError.message || 'Could not save.'}});
        }
    }

    return (
        <li>
            <form className="admin-achievement" onSubmit={save}>
                <label className="admin-icon-field">
                    <span>Icon</span>
                    <input value={form.icon} maxLength={20} onChange={set('icon')}/>
                </label>

                <label>
                    <span>Name</span>
                    <input value={form.name} maxLength={100} required onChange={set('name')}/>
                </label>

                <label className="admin-form-wide">
                    <span>Description</span>
                    <input value={form.description} maxLength={500} onChange={set('description')}/>
                </label>

                <label className="admin-xp-field">
                    <span>XP reward</span>
                    <input
                        type="number"
                        min="0"
                        max="10000"
                        value={form.xpReward}
                        onChange={set('xpReward')}
                    />
                </label>

                <div className="admin-actions">
                    <button type="submit" className="admin-primary" disabled={!changed || state.busy}>
                        {state.busy ? 'Saving…' : 'Save'}
                    </button>
                    {state.message && (
                        <span className={`admin-inline${state.message.ok ? '' : ' is-error'}`} role="status">
                            {state.message.text}
                        </span>
                    )}
                </div>
            </form>
        </li>
    );
}

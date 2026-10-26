import '../../styles/keycap.css';
import '../../styles/arcade.css';

export default function GameLoading() {
    return (
        <main className="kc kc-page" aria-busy="true">
            <p className="kc-cue" role="status">Loading…</p>
        </main>
    );
}

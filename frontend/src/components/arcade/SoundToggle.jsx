import useSound from '../../hooks/useSound';

// Small mute button for a game's top bar. Full options are in Settings.
export default function SoundToggle() {
    const {enabled, toggle, play} = useSound();

    return (
        <button
            type="button"
            className="kc-btn kc-btn--ghost kc-btn--sm"
            aria-pressed={enabled}
            onClick={() => {
                toggle();
                // Heard only when turning sound on.
                if (!enabled) setTimeout(() => play('click'), 0);
            }}
        >
            Sound {enabled ? 'on' : 'off'}
        </button>
    );
}

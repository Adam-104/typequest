import {useSyncExternalStore} from 'react';

import {
    getSoundSettings,
    playSound,
    playTyping,
    setSoundEnabled,
    setSoundVolume,
    setTypingSounds,
    subscribeSound,
} from '../utils/soundEngine';

// Sound settings (shared by every page) and the functions that make noise.
//
//   play('hit', {step})   a named effect (see soundEngine.js)
//   typeKey(char, ok)     the sound of one typed character
export default function useSound() {
    const settings = useSyncExternalStore(subscribeSound, getSoundSettings);

    return {
        enabled: settings.enabled,
        volume: settings.volume,
        typing: settings.typing,
        toggle: () => setSoundEnabled(!getSoundSettings().enabled),
        setEnabled: setSoundEnabled,
        setVolume: setSoundVolume,
        setTyping: setTypingSounds,
        play: playSound,
        typeKey: playTyping,
    };
}

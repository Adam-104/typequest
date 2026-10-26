import {useSyncExternalStore} from 'react';

import {
    getThemeSnapshot,
    setThemePreference,
    subscribeTheme,
} from '../utils/theme';

// {preference: 'light'|'dark'|'system', resolved: 'light'|'dark', setPreference}
export default function useTheme() {
    const {preference, resolved} = useSyncExternalStore(subscribeTheme, getThemeSnapshot);

    return {preference, resolved, setPreference: setThemePreference};
}

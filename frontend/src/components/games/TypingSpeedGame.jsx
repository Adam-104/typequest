import PassageArena from '../arcade/PassageArena';
import {speedConfig} from '../arcade/passageConfigs';
import GameLoading from './GameLoading';
import usePassages from './usePassages';
import {useMemo} from 'react';

export default function TypingSpeedGame() {
    const {passages, ready} = usePassages('SPEED', speedConfig.passages);
    const config = useMemo(() => ({...speedConfig, passages}), [passages]);

    if (!ready) return <GameLoading/>;

    return <PassageArena config={config}/>;
}

import PassageArena from '../arcade/PassageArena';
import {racerConfig} from '../arcade/passageConfigs';
import GameLoading from './GameLoading';
import usePassages from './usePassages';
import {useMemo} from 'react';

export default function TypingRacerGame() {
    const {passages, ready} = usePassages('RACE', racerConfig.passages);
    const config = useMemo(() => ({...racerConfig, passages}), [passages]);

    if (!ready) return <GameLoading/>;

    return <PassageArena config={config}/>;
}

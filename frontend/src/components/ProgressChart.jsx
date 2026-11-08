import {useMemo, useState} from 'react';

// A small line chart of recent games, drawn as plain SVG (no chart library).
// Shows speed or accuracy, one point per game, oldest on the left.
const WIDTH = 640;
const HEIGHT = 250;
const PAD = {top: 18, right: 18, bottom: 34, left: 46};
const MAX_POINTS = 20;

const METRICS = {
    wpm: {label: 'Speed', unit: ' WPM', read: (game) => game.wpm},
    accuracy: {label: 'Accuracy', unit: '%', read: (game) => game.accuracy},
};

// Round the top (and for accuracy the bottom) of the scale to tidy numbers.
function scaleFor(metric, values) {
    const high = Math.max(...values);
    const low = Math.min(...values);

    if (metric === 'accuracy') {
        const floor = Math.max(0, Math.floor((low - 5) / 10) * 10);

        return {min: Math.min(floor, 90), max: 100};
    }

    const step = high > 100 ? 50 : 20;

    return {min: 0, max: Math.max(step, Math.ceil((high * 1.1) / step) * step)};
}

function shortDate(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString(undefined, {day: 'numeric', month: 'short'});
}

export default function ProgressChart({games}) {
    const [metric, setMetric] = useState('wpm');

    const ordered = useMemo(
        () => games
            .filter((game) => !Number.isNaN(new Date(game.playedAt).getTime()))
            .sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt))
            .slice(-MAX_POINTS),
        [games],
    );

    if (ordered.length < 2) {
        return (
            <p className="chart-empty">
                Play at least two games and your speed and accuracy trend will appear here.
            </p>
        );
    }

    const config = METRICS[metric];
    const values = ordered.map((game) => Number(config.read(game)) || 0);
    const {min, max} = scaleFor(metric, values);

    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;

    const x = (index) => PAD.left + (innerW * index) / (values.length - 1);
    const y = (value) => PAD.top + innerH - ((value - min) / (max - min)) * innerH;

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const best = Math.max(...values);
    const bestIndex = values.indexOf(best);
    const latest = values[values.length - 1];
    const change = latest - values[0];

    const line = values.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
    const area = `${line} L${x(values.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left},${(PAD.top + innerH).toFixed(1)} Z`;

    const ticks = [0, 1, 2, 3, 4].map((step) => min + ((max - min) * step) / 4);

    const format = (value) => `${Math.round(value)}${config.unit}`;
    const summary =
        `${config.label} over your last ${values.length} games: best ${format(best)}, average ${format(average)}, `
        + `latest ${format(latest)}.`;

    return (
        <div className="chart">
            <div className="chart-toolbar">
                <div className="chart-toggle" role="group" aria-label="Chart metric">
                    {Object.entries(METRICS).map(([key, item]) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={metric === key}
                            onClick={() => setMetric(key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <span className="chart-note">Last {values.length} games</span>
            </div>

            <div className="chart-stats">
                <div><span>Best</span><strong>{format(best)}</strong></div>
                <div><span>Average</span><strong>{format(average)}</strong></div>
                <div><span>Latest</span><strong>{format(latest)}</strong></div>
                <div>
                    <span>Change</span>
                    <strong className={change >= 0 ? 'is-up' : 'is-down'}>
                        {change >= 0 ? '+' : '−'}{Math.abs(Math.round(change))}{config.unit.trim() === '%' ? ' pts' : ' WPM'}
                    </strong>
                </div>
            </div>

            <svg
                className="chart-svg"
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                role="img"
                aria-label={summary}
            >
                {ticks.map((tick) => (
                    <g key={tick}>
                        <line
                            className="chart-grid"
                            x1={PAD.left}
                            x2={WIDTH - PAD.right}
                            y1={y(tick)}
                            y2={y(tick)}
                        />
                        <text className="chart-axis" x={PAD.left - 8} y={y(tick) + 4} textAnchor="end">
                            {Math.round(tick)}{metric === 'accuracy' ? '%' : ''}
                        </text>
                    </g>
                ))}

                <line
                    className="chart-average"
                    x1={PAD.left}
                    x2={WIDTH - PAD.right}
                    y1={y(average)}
                    y2={y(average)}
                />

                <path className="chart-area" d={area}/>
                <path className="chart-line" d={line}/>

                {values.map((value, index) => (
                    <circle
                        key={ordered[index].id ?? index}
                        className={index === bestIndex ? 'chart-dot is-best' : 'chart-dot'}
                        cx={x(index)}
                        cy={y(value)}
                        r={index === bestIndex ? 6 : 4}
                    >
                        <title>{`${shortDate(ordered[index].playedAt)}: ${format(value)}`}</title>
                    </circle>
                ))}

                <text className="chart-axis" x={x(0)} y={HEIGHT - 10} textAnchor="start">
                    {shortDate(ordered[0].playedAt)}
                </text>
                <text className="chart-axis" x={x(values.length - 1)} y={HEIGHT - 10} textAnchor="end">
                    {shortDate(ordered[ordered.length - 1].playedAt)}
                </text>
            </svg>

            <p className="chart-legend">
                <span className="legend-line"/> your games
                <span className="legend-avg"/> average
                <span className="legend-best"/> best
            </p>
        </div>
    );
}

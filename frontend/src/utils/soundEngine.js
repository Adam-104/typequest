// TypeQuest's sound effects, synthesized with the Web Audio API (no audio
// files to download). Everything is built from three pieces: a short noise
// burst (the "clack"), a tone with a pitch sweep (the "thock", lasers, bells)
// and a bell (a few sine partials that ring out).
//
// Settings are saved in localStorage and shared by every page.

const KEYS = {enabled: 'typequest-sound', volume: 'typequest-volume', typing: 'typequest-typing-sound'};

function readSettings() {
    try {
        const volume = Number(localStorage.getItem(KEYS.volume));

        return {
            // On unless the player turned it off.
            enabled: localStorage.getItem(KEYS.enabled) !== 'off',
            volume: localStorage.getItem(KEYS.volume) === null || Number.isNaN(volume)
                ? 0.6
                : Math.min(1, Math.max(0, volume)),
            typing: localStorage.getItem(KEYS.typing) !== 'off',
        };
    } catch {
        return {enabled: true, volume: 0.6, typing: true};
    }
}

let settings = readSettings();
const listeners = new Set();

function save(key, value) {
    try {
        localStorage.setItem(KEYS[key], String(value));
    } catch {
        // Not remembering the choice is fine.
    }
}

function change(patch) {
    settings = {...settings, ...patch};
    listeners.forEach((listener) => listener());
    applyVolume();
}

export const getSoundSettings = () => settings;

export function subscribeSound(listener) {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function setSoundEnabled(enabled) {
    save('enabled', enabled ? 'on' : 'off');
    change({enabled});
}

export function setSoundVolume(volume) {
    const value = Math.min(1, Math.max(0, volume));

    save('volume', value.toFixed(2));
    change({volume: value});
}

export function setTypingSounds(typing) {
    save('typing', typing ? 'on' : 'off');
    change({typing});
}

// ---------------------------------------------------------------------------
// Audio graph

let context = null;
let master = null;
let noiseBuffer = null;

function applyVolume() {
    // Perceived loudness is roughly the square of the gain.
    if (master) master.gain.value = settings.volume * settings.volume * 1.1;
}

function ensure() {
    if (context) return context;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    context = new AudioContextClass();

    const compressor = context.createDynamicsCompressor();

    master = context.createGain();
    master.connect(compressor);
    compressor.connect(context.destination);
    applyVolume();

    // One second of white noise, reused by every click and swoosh.
    noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);

    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

    return context;
}

// Browsers keep audio locked until the player touches the page.
export function unlockAudio() {
    try {
        const audio = ensure();

        if (audio && audio.state === 'suspended') audio.resume();
    } catch {
        // No audio: the game works without it.
    }
}

if (typeof window !== 'undefined') {
    ['pointerdown', 'keydown', 'touchstart'].forEach((type) => {
        window.addEventListener(type, unlockAudio, {passive: true});
    });
}

const jitter = (amount) => 1 + (Math.random() * 2 - 1) * amount;

// A tone that glides from `f` to `to`.
function tone({at, f, to = f, d, gain = 0.2, type = 'sine', attack = 0.004, lowpass}) {
    const osc = context.createOscillator();
    const amp = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(f, at);

    if (to !== f) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + d);

    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + d);

    let node = osc;

    if (lowpass) {
        const filter = context.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.value = lowpass;
        osc.connect(filter);
        node = filter;
    }

    node.connect(amp);
    amp.connect(master);
    osc.start(at);
    osc.stop(at + d + 0.03);
}

// A burst of filtered noise: clicks, clacks, swooshes, explosions.
function noise({at, d, gain = 0.3, type = 'bandpass', f = 2000, to = f, q = 1}) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const amp = context.createGain();

    source.buffer = noiseBuffer;
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(f, at);

    if (to !== f) filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + d);

    amp.gain.setValueAtTime(gain, at);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + d);

    source.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    source.start(at, Math.random() * 0.5);
    source.stop(at + d + 0.03);
}

// A struck metal bell: a few partials that ring out at different speeds.
function bell({at, f, d = 0.9, gain = 0.2}) {
    [[1, 1], [2.76, 0.45], [5.4, 0.2]].forEach(([ratio, weight], index) => {
        tone({at, f: f * ratio, d: d / (1 + index * 0.9), gain: gain * weight, attack: 0.002});
    });
}

// ---------------------------------------------------------------------------
// The sounds

const PENTATONIC = [1, 1.125, 1.25, 1.5, 1.6667];

const SOUNDS = {
    // A typewriter key: a crisp clack on top of a soft thock.
    key(at) {
        noise({at, d: 0.03, gain: 0.32 * jitter(0.15), f: 2300 * jitter(0.3), q: 1.3});
        tone({at, f: 175 * jitter(0.1), to: 70, d: 0.055, gain: 0.3 * jitter(0.15)});
    },

    space(at) {
        noise({at, d: 0.07, gain: 0.34, f: 850, q: 0.8});
        tone({at, f: 120, to: 48, d: 0.11, gain: 0.45});
    },

    // The carriage return: a swoosh and the little bell at the end of the line.
    enter(at) {
        noise({at, d: 0.2, gain: 0.3, f: 1900, to: 550, q: 0.9});
        bell({at: at + 0.12, f: 2093, d: 0.7, gain: 0.16});
    },

    // A mistyped key: a dull, short buzz.
    error(at) {
        tone({at, f: 150, to: 88, d: 0.15, gain: 0.2, type: 'sawtooth', lowpass: 650});
        noise({at, d: 0.06, gain: 0.22, type: 'lowpass', f: 420});
    },

    // A word cleared. Climbs a pentatonic scale as the chain grows.
    hit(at, {step = 0} = {}) {
        const octave = Math.min(2, 2 ** Math.floor(step / 5));
        const f = 392 * PENTATONIC[step % 5] * octave;

        tone({at, f, d: 0.24, gain: 0.2, type: 'triangle'});
        tone({at, f: f * 2, d: 0.14, gain: 0.07});
        noise({at, d: 0.025, gain: 0.18, f: 3400, q: 1.5});
    },

    // Space Mission: blast the asteroid.
    laser(at) {
        tone({at, f: 1500, to: 170, d: 0.17, gain: 0.11, type: 'sawtooth', lowpass: 3200});
    },

    explode(at) {
        noise({at: at + 0.04, d: 0.4, gain: 0.5, type: 'lowpass', f: 1500, to: 110});
        tone({at: at + 0.04, f: 95, to: 32, d: 0.34, gain: 0.5});
    },

    // Ninja: a blade through the air.
    slash(at, {step = 0} = {}) {
        const lift = 1 + Math.min(step, 8) * 0.06;

        noise({at, d: 0.15, gain: 0.42, f: 4200 * lift, to: 850, q: 0.8});
        tone({at, f: 950 * lift, to: 280, d: 0.1, gain: 0.07, type: 'triangle'});
    },

    // A word got through: the heavy thud of it landing.
    thud(at) {
        tone({at, f: 125, to: 38, d: 0.3, gain: 0.6});
        noise({at, d: 0.14, gain: 0.36, type: 'lowpass', f: 520});
    },

    // A life or fuel lost.
    life(at) {
        tone({at, f: 440, to: 400, d: 0.18, gain: 0.17, type: 'triangle'});
        tone({at: at + 0.15, f: 330, to: 292, d: 0.28, gain: 0.17, type: 'triangle'});
    },

    tick(at) {
        tone({at, f: 1050, d: 0.05, gain: 0.22, attack: 0.001});
        noise({at, d: 0.015, gain: 0.15, f: 3500});
    },

    go(at) {
        bell({at, f: 880, d: 0.5, gain: 0.16});
        tone({at, f: 440, d: 0.2, gain: 0.1, type: 'triangle'});
        tone({at: at + 0.09, f: 660, d: 0.3, gain: 0.1, type: 'triangle'});
    },

    pause(at) {
        tone({at, f: 640, to: 430, d: 0.12, gain: 0.14, type: 'triangle'});
    },

    resume(at) {
        tone({at, f: 430, to: 640, d: 0.12, gain: 0.14, type: 'triangle'});
    },

    click(at) {
        noise({at, d: 0.022, gain: 0.22, f: 1900, q: 1.1});
    },

    // A star earned at the end of a lesson; each one rings higher.
    star(at, {step = 0} = {}) {
        bell({at, f: 660 * 1.25 ** step, d: 0.8, gain: 0.17});
    },

    win(at) {
        [523, 659, 784].forEach((f, index) => {
            bell({at: at + index * 0.11, f, d: 0.5, gain: 0.15});
        });
        bell({at: at + 0.36, f: 1047, d: 1.1, gain: 0.18});
    },

    // New personal best: the win jingle plus a shower of sparkles.
    best(at) {
        SOUNDS.win(at);

        [2093, 2637, 3136, 2637, 3520].forEach((f, index) => {
            tone({at: at + 0.5 + index * 0.07, f, d: 0.18, gain: 0.06});
        });
    },

    lose(at) {
        [392, 330, 262, 196].forEach((f, index) => {
            tone({at: at + index * 0.17, f, to: f * 0.97, d: 0.36, gain: 0.16, type: 'triangle', lowpass: 1400});
        });
    },
};

const THROTTLED = {key: 22, space: 22, error: 60, click: 30, tick: 20};
const lastPlayed = {};

export const SOUND_NAMES = Object.keys(SOUNDS);

export function playSound(name, options) {
    if (!settings.enabled || settings.volume <= 0) return;

    const sound = SOUNDS[name];

    if (!sound) return;

    // Fast typing must not stack up dozens of overlapping clacks.
    const now = performance.now();
    const gap = THROTTLED[name];

    if (gap && now - (lastPlayed[name] ?? -Infinity) < gap) return;

    lastPlayed[name] = now;

    try {
        const audio = ensure();

        if (!audio) return;

        if (audio.state === 'suspended') audio.resume();

        sound(audio.currentTime + 0.005, options);
    } catch {
        // A browser that blocks audio must not break a game.
    }
}

// The sound for one typed character. Obeys the "typing sounds" setting.
export function playTyping(char, ok = true) {
    if (!settings.typing) return;

    if (!ok) playSound('error');
    else if (char === ' ') playSound('space');
    else if (char === '\n') playSound('enter');
    else playSound('key');
}

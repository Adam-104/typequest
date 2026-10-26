// QWERTY layout, finger assignments and helpers for the on-screen keyboard.
// Finger ids: lp lr lm li (left pinky..index), ri rm rr rp (right), th (thumbs).

export const FINGER_NAMES = {
    lp: 'left little finger',
    lr: 'left ring finger',
    lm: 'left middle finger',
    li: 'left index finger',
    ri: 'right index finger',
    rm: 'right middle finger',
    rr: 'right ring finger',
    rp: 'right little finger',
    th: 'thumb',
};

const fingerOf = {};

[
    ['lp', '`1qaz'], ['lr', '2wsx'], ['lm', '3edc'], ['li', '45rtfgvb'],
    ['ri', '67yuhjnm'], ['rm', '8ik,'], ['rr', '9ol.'], ['rp', '0-=p[]\;\'/'],
    ['th', ' '],
].forEach(([finger, keys]) => {
    for (const key of keys) fingerOf[key] = finger;
});

// Rows of the board. Each key is [id, label, width]; width is relative.
const letters = (text) => text.split('').map((key) => [key, key, 1]);

export const ROWS = [
    [...letters('`1234567890-='), ['Backspace', '⌫', 2]],
    [['Tab', 'tab', 1.5], ...letters('qwertyuiop[]\\').map(([k, l, w], i, a) => [k, l, i === a.length - 1 ? 1.5 : w])],
    [['Caps', 'caps', 1.8], ...letters('asdfghjkl;\''), ['Enter', 'enter', 2.2]],
    [['ShiftL', 'shift', 2.4], ...letters('zxcvbnm,./'), ['ShiftR', 'shift', 2.8]],
    [[' ', 'space', 7]],
];

export const HOME_KEYS = 'asdfjkl;';

const SHIFTED = {
    '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7',
    '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\',
    ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/',
};

export function fingerFor(keyId) {
    if (keyId === 'ShiftL' || keyId === 'Tab' || keyId === 'Caps') return 'lp';
    if (keyId === 'ShiftR' || keyId === 'Enter' || keyId === 'Backspace') return 'rp';

    return fingerOf[keyId] ?? null;
}

// Which key(s) to press for a character: {key, shift} where shift is the
// id of the Shift key to hold (the one on the opposite hand), or null.
export function keysForChar(char) {
    if (!char) return null;

    let key = char;
    let needsShift = false;

    if (char >= 'A' && char <= 'Z') {
        key = char.toLowerCase();
        needsShift = true;
    } else if (SHIFTED[char]) {
        key = SHIFTED[char];
        needsShift = true;
    }

    const finger = fingerFor(key);

    if (!finger) return null;

    const leftHand = finger.startsWith('l');

    return {
        key,
        finger,
        shift: needsShift ? (leftHand ? 'ShiftR' : 'ShiftL') : null,
    };
}

// "Use your left ring finger" for the given target character.
export function fingerHint(char) {
    const info = keysForChar(char);

    if (!info) return '';

    if (info.finger === 'th') return 'Use either thumb for the space bar.';

    const shift = info.shift
        ? ` Hold ${info.shift === 'ShiftR' ? 'right' : 'left'} Shift with your little finger.`
        : '';

    return `Use your ${FINGER_NAMES[info.finger]}.${shift}`;
}

// The set of keys needed to type some text (lowercase ids), for highlighting.
export function keysInText(text) {
    const keys = new Set();

    for (const char of text) {
        const info = keysForChar(char);

        if (info) {
            keys.add(info.key);

            if (info.shift) keys.add(info.shift);
        }
    }

    return keys;
}

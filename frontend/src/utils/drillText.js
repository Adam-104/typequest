import {commonWords, punctuationPhrases} from '../data/words';

export const FOCUS_OPTIONS = [
    {id: 'home', title: 'Home row', keys: 'a s d f g h j k l', blurb: 'The keys your fingers rest on.', letters: 'asdfghjkl', density: 0.85},
    {id: 'top', title: 'Top row', keys: 'q w e r t y u i o p', blurb: 'Reach up without losing your place.', letters: 'qwertyuiop', density: 0.85},
    {id: 'bottom', title: 'Bottom row', keys: 'z x c v b n m', blurb: 'The hardest reach for most people.', letters: 'zxcvbnm', density: 0.4},
    {id: 'numbers', title: 'Numbers', keys: '1 2 3 4 5 6 7 8 9 0', blurb: 'Digit groups, no looking down.'},
    {id: 'punctuation', title: 'Punctuation', keys: ', . ; : \' " ! ? ( )', blurb: 'Commas, quotes and symbols in real sentences.'},
    {id: 'words', title: 'Common words', keys: 'the of and to in', blurb: 'The words you type most.'},
    {id: 'weak', title: 'Your weak keys', keys: '', blurb: 'Built from the keys you miss or type slowly.'},
];

const VOWELS = 'aeiou';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function density(word, letters) {
    let hits = 0;

    for (const char of word) {
        if (letters.includes(char)) hits += 1;
    }

    return hits / word.length;
}

// A made-up "word" from the given letters, with no letter three times in a row.
function pseudoWord(letters, extra = '') {
    const pool = letters + extra;
    const length = 3 + Math.floor(Math.random() * 3);
    let word = '';

    while (word.length < length) {
        const next = pick(pool);

        if (word.length >= 2 && word.slice(-2) === next + next) continue;

        word += next;
    }

    return word;
}

function sample(count, makeOne) {
    const out = [];

    while (out.length < count) {
        const next = makeOne();

        if (next !== out[out.length - 1]) out.push(next);
    }

    return out;
}

function letterDrill(count, letters, minDensity, mustInclude = '') {
    const real = commonWords.filter((word) =>
        density(word, letters) >= minDensity
        && (!mustInclude || [...mustInclude].some((char) => word.includes(char))));
    const filler = letters.includes('a') || [...VOWELS].some((vowel) => letters.includes(vowel))
        ? ''
        : 'aeo';

    // With few real words, lean on made-up letter groups so drills stay varied.
    const realShare = real.length >= 12 ? 0.75 : real.length >= 4 ? 0.4 : 0;

    return sample(count, () =>
        Math.random() < realShare ? pick(real) : pseudoWord(letters, filler));
}

function numberDrill(count) {
    return sample(count, () => {
        const length = 2 + Math.floor(Math.random() * 4);
        let digits = '';

        for (let index = 0; index < length; index += 1) {
            digits += Math.floor(Math.random() * 10);
        }

        return digits;
    });
}

function phraseDrill(count) {
    const words = [];
    let last = '';

    while (words.length < count) {
        let phrase = pick(punctuationPhrases);

        while (phrase === last) phrase = pick(punctuationPhrases);

        last = phrase;
        words.push(...phrase.split(' '));
    }

    return words.slice(0, count);
}

// weakChars: characters from keyStats.weakestKeys().
export function buildDrillText(focusId, wordCount, weakChars = []) {
    const focus = FOCUS_OPTIONS.find((option) => option.id === focusId);
    let words;

    if (focus?.letters) {
        words = letterDrill(wordCount, focus.letters, focus.density);
    } else if (focusId === 'numbers') {
        words = numberDrill(wordCount);
    } else if (focusId === 'punctuation') {
        words = phraseDrill(wordCount);
    } else if (focusId === 'weak' && weakChars.length) {
        const letters = weakChars.filter((char) => /[a-z]/.test(char)).join('');
        const symbols = weakChars.filter((char) => !/[a-z]/.test(char));

        words = letters
            ? letterDrill(wordCount, 'asdfjkl' + letters, 0.2, letters)
            : sample(wordCount, () => pick(commonWords));

        // Weave the weak symbols into some words so they get typed too.
        if (symbols.length) {
            words = words.map((word) => (Math.random() < 0.35 ? word + pick(symbols) : word));
        }
    } else {
        words = sample(wordCount, () => pick(commonWords));
    }

    return words.join(' ');
}

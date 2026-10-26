import {useMemo} from 'react';

import {HOME_KEYS, ROWS, keysForChar} from '../utils/keyboardMap';
import '../styles/keyboard.css';

// On-screen keyboard. Decorative: the text on the page says the same thing,
// so it is hidden from screen readers.
//
//   next       character the player must type next (lit up)
//   flash      {char, ok, id} the last key pressed, shown green or red
//   lit        Set of key ids to keep lit (e.g. the keys a lesson teaches)
//   fingers    colour keys by the finger that presses them
export default function Keyboard({next = '', flash = null, lit = null, fingers = true}) {
    const target = useMemo(() => keysForChar(next), [next]);
    const pressed = useMemo(() => (flash ? keysForChar(flash.char) : null), [flash]);

    return (
        <div className={`kb${fingers ? ' kb--fingers' : ''}`} aria-hidden="true">
            {ROWS.map((row, rowIndex) => (
                <div className="kb-row" key={rowIndex}>
                    {row.map(([id, label, width]) => {
                        let state = 'kb-key';

                        if (target && (target.key === id || target.shift === id)) state += ' is-next';
                        else if (lit?.has(id)) state += ' is-lit';

                        if (pressed && flash && pressed.key === id) {
                            state += flash.ok ? ' is-ok' : ' is-bad';
                        }

                        return (
                            <span
                                key={id}
                                className={state}
                                data-finger={fingerClass(id)}
                                style={{flexGrow: width}}
                            >
                                {label}
                                {HOME_KEYS.includes(id) && (id === 'f' || id === 'j') && (
                                    <i className="kb-bump"/>
                                )}
                            </span>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function fingerClass(id) {
    return keysForChar(id.length === 1 ? id : '')?.finger
        ?? (id === 'ShiftL' || id === 'Tab' || id === 'Caps' ? 'lp'
            : id === 'ShiftR' || id === 'Enter' || id === 'Backspace' ? 'rp' : '');
}

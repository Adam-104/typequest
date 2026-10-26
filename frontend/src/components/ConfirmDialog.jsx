import {useEffect, useId, useRef} from 'react';
import {createPortal} from 'react-dom';

import '../styles/dialog.css';

// A small paper card that asks "are you sure?". Esc and a click outside close
// it (unless it is busy), and focus goes to the safe button first.
export default function ConfirmDialog({
    title,
    children,
    confirmLabel = 'Confirm',
    busyLabel = 'Working…',
    cancelLabel = 'Cancel',
    busy = false,
    onConfirm,
    onCancel,
}) {
    const titleId = useId();
    const bodyId = useId();
    const cancelRef = useRef(null);

    useEffect(() => {
        const previous = document.activeElement;

        cancelRef.current?.focus();

        function onKey(event) {
            if (event.key === 'Escape' && !busy) onCancel();

            // Keep Tab inside the dialog.
            if (event.key === 'Tab') {
                const buttons = [...document.querySelectorAll('.dialog-card button:not(:disabled)')];

                if (!buttons.length) return;

                const first = buttons[0];
                const last = buttons[buttons.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }

        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
            previous?.focus?.();
        };
    }, [busy, onCancel]);

    return createPortal(
        <div
            className="dialog-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onCancel();
            }}
        >
            <section
                className="dialog-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={bodyId}
            >
                <div className="dialog-stamp" aria-hidden="true">↗</div>
                <h2 id={titleId}>{title}</h2>
                <p id={bodyId}>{children}</p>

                <div className="dialog-actions">
                    <button ref={cancelRef} type="button" className="dialog-btn" onClick={onCancel} disabled={busy}>
                        {cancelLabel}
                    </button>
                    <button type="button" className="dialog-btn dialog-btn--primary" onClick={onConfirm} disabled={busy}>
                        {busy ? busyLabel : confirmLabel}
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}

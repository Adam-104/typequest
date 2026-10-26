import '../styles/Pages.css';

export function LoadingRows({count = 5}) {
    return (
        <div className="skeleton-list" aria-busy="true" aria-label="Loading">
            {Array.from({length: count}, (_, index) => (
                <div className="skeleton-row" key={index}/>
            ))}
        </div>
    );
}

export function ErrorState({message, onRetry}) {
    return (
        <div className="page-state" role="alert">
            <div className="page-state-icon" aria-hidden="true">⚠</div>
            <h3>Something went wrong</h3>
            <p>{message}</p>
            {onRetry && (
                <button type="button" className="primary-button" onClick={onRetry}>
                    Try again
                </button>
            )}
        </div>
    );
}

export function EmptyState({icon, title, text, children}) {
    return (
        <div className="page-state">
            <div className="page-state-icon" aria-hidden="true">{icon}</div>
            <h3>{title}</h3>
            <p>{text}</p>
            {children}
        </div>
    );
}

import {Component} from 'react';

import {reportError} from '../utils/errorReporter';

// Last line of defence: a crash inside a page shows this card instead of a
// blank screen, and is reported to the server log.
export default class ErrorBoundary extends Component {
    state = {failed: false};

    static getDerivedStateFromError() {
        return {failed: true};
    }

    componentDidCatch(error) {
        reportError(error, 'react');
    }

    render() {
        if (!this.state.failed) return this.props.children;

        return (
            <main className="crash-page">
                <section className="crash-card" role="alert">
                    <span className="crash-eyebrow">§ paper jam</span>
                    <h1>Something went <em>wrong.</em></h1>
                    <p>
                        TypeQuest hit a snag. Your progress is saved on the server,
                        so nothing is lost. Reload the page to carry on.
                    </p>
                    <button type="button" onClick={() => window.location.assign('/')}>
                        Reload TypeQuest
                    </button>
                </section>
            </main>
        );
    }
}

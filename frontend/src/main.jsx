import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';

import App from './App.jsx';
import './index.css';
import './styles/settings.css';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import {installErrorReporting} from './utils/errorReporter.js';
import {startThemeWatcher} from './utils/theme.js';
import {wakeServer} from './utils/wakeServer.js';
import {AuthProvider} from './context/AuthContext.jsx';
import {LessonProgressProvider} from './context/LessonProgressContext.jsx';
import {PlayerProvider} from './context/PlayerContext.jsx';

installErrorReporting();
startThemeWatcher();
wakeServer();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <PlayerProvider>
                        <LessonProgressProvider>
                            <App/>
                        </LessonProgressProvider>
                    </PlayerProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>,
);
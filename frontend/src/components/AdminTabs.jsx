import {NavLink} from 'react-router-dom';

const TABS = [
    {to: '/admin', label: 'Overview', end: true},
    {to: '/admin/users', label: 'Players'},
    {to: '/admin/scores', label: 'Scores'},
    {to: '/admin/content', label: 'Content'},
];

export default function AdminTabs() {
    return (
        <nav className="admin-tabs" aria-label="Admin sections">
            {TABS.map((tab) => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    end={tab.end}
                    className={({isActive}) => `admin-tab${isActive ? ' active' : ''}`}
                >
                    {tab.label}
                </NavLink>
            ))}
        </nav>
    );
}

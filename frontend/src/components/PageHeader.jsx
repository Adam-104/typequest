import {useAuth} from '../context/AuthContext';
import VerifyBanner from './VerifyBanner';

export default function PageHeader({section}) {
    const {user} = useAuth();
    const username = user?.username || 'Player';

    return (
        <>
        <header className="topbar">
            <div>
                <span className="breadcrumb">YOUR SPACE / </span>
                <span className="breadcrumb-current">{section.toUpperCase()}</span>
            </div>

            <div className="topbar-actions">
                <div className="topbar-divider"/>
                <div className="topbar-user">
                    <div className="avatar small-avatar">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <strong>{username}</strong>
                        <span>TypeQuest Player</span>
                    </div>
                </div>
            </div>
        </header>
        <VerifyBanner/>
        </>
    );
}

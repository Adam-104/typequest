import AdminTabs from './AdminTabs';
import PageHeader from './PageHeader';
import '../styles/Pages.css';
import '../styles/admin.css';

// Frame shared by every admin page: header, title and section tabs.
export default function AdminShell({title, intro, actions, children}) {
    return (
        <main className="dashboard">
            <PageHeader section="Admin"/>

            <section className="welcome-section">
                <div>
                    <div className="eyebrow">Admin desk</div>
                    <h1>{title}</h1>
                    {intro && <p>{intro}</p>}
                </div>

                {actions}
            </section>

            <AdminTabs/>

            {children}
        </main>
    );
}

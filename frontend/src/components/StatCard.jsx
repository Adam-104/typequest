export default function StatCard({icon, label, value, unit, detail, color}) {
    return (
        <article className="stat-card">
            <div className={`stat-icon ${color}`} aria-hidden="true">
                {icon}
            </div>

            <div className="stat-content">
                <span className="stat-label">{label}</span>
                <div className="stat-value">
                    {value}
                    {unit && <small>{unit}</small>}
                </div>
                <span className="stat-detail">{detail}</span>
            </div>
        </article>
    );
}

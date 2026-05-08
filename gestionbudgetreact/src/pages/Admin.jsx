import { Link } from "react-router-dom";
import { useState } from "react";
import "../App.css";

function Admin() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => !prev);
        setMobileOpen(false);
    };

    const toggleMobileSidebar = () => {
        setMobileOpen(prev => !prev);
        setSidebarCollapsed(false);
    };

    const closeMobileSidebar = () => {
        setMobileOpen(false);
        setSidebarCollapsed(false);
    };

    return (
        <>
            {/* Hamburger mobile */}
            <button
                className={`sidebar-toggle mobile-menu-btn ${mobileOpen ? "active" : ""}`}
                onClick={toggleMobileSidebar}
            >
                <span className="hamburger"></span>
            </button>

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${mobileOpen ? "active" : ""}`}
                onClick={closeMobileSidebar}
            />

            {/* Sidebar */}
            <nav className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="sidebar-logo-text"><img
                            src="Softwell.png"
                            alt="Logo"
                            style={{ width: "75px", marginRight: "30px" }}
                        /></span>
                    </div>

                    <button
                        className={`sidebar-toggle ${sidebarCollapsed ? "active" : ""}`}
                        onClick={toggleSidebar}
                    >
                        <span className="hamburger"></span>
                    </button>
                </div>

                <ul className="sidebar-menu">
                    <li>
                        <Link to="/admin" className="sidebar-menu-link" onClick={closeMobileSidebar}>
                            <span className="material-icons">dashboard</span>
                            <span className="sidebar-menu-text">Dashboard</span>
                        </Link>
                    </li>

                    <li>
                        <Link to="/validation" className="sidebar-menu-link" onClick={closeMobileSidebar}>
                            <span className="material-icons">fact_check</span>
                            <span className="sidebar-menu-text">Validations</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/listrealisationencours" className="sidebar-menu-link" onClick={closeMobileSidebar}>
                            <span className="material-icons">assignment</span>
                            <span className="sidebar-menu-text">Liste Réalisation</span>
                        </Link>
                    </li>

                    <li>
                        <Link to="/reaffectation" className="sidebar-menu-link" onClick={closeMobileSidebar}>
                            <span className="material-icons">sync_alt</span>
                            <span className="sidebar-menu-text">Réaffectations</span>
                        </Link>
                    </li>

                    <li>
                        <Link to="/utilisateurs" className="sidebar-menu-link" onClick={closeMobileSidebar}>
                            <span className="material-icons">people</span>
                            <span className="sidebar-menu-text">Utilisateurs</span>
                        </Link>
                    </li>
                </ul>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">AD</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">Admin</div>
                            <div className="sidebar-user-role">Direction</div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
                <h1>Dashboard Admin</h1>
                <p>Bienvenue dans l'espace Direction</p>
            </main>
        </>
    );
}

export default Admin;
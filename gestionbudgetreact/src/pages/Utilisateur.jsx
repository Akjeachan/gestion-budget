import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { User } from "../services/api";
import "../App.css";

function Utilisateur() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await User();
                if (Array.isArray(data)) setUsers(data);
                else if (data?.users) setUsers(data.users);
                else if (data) setUsers([data]);
            } catch (e) {
                setError(e.message);
            }
        };
        fetchUsers();
    }, []);

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

    const isActive = (path) =>
        location.pathname === path ? "active" : "";

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
            <nav
                className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
            >
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
                        <Link
                            to="/utilisateur"
                            className={`sidebar-menu-link ${isActive("/utilisateur")}`}
                            onClick={closeMobileSidebar}
                        >
                            <span className="material-icons">home</span>
                            <span className="sidebar-menu-text">Accueil</span>
                        </Link>
                    </li>

                    <li>
                        <Link
                            to="/plannification"
                            className={`sidebar-menu-link ${isActive("/plannification")}`}
                            onClick={closeMobileSidebar}
                        >
                            <span className="material-icons">calendar_today</span>
                            <span className="sidebar-menu-text">Plannification</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/listplannificationrealisation"
                            className={`sidebar-menu-link ${isActive("/listplannificationrealisation")}`}
                            onClick={closeMobileSidebar}
                        >
                            <span className="material-icons">check_circle</span>
                            <span className="sidebar-menu-text">Réalisation</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/listrealisation"
                            className={`sidebar-menu-link ${isActive("/listrealisation")}`}
                            onClick={closeMobileSidebar}
                        >
                            <span className="material-icons">list_alt</span>
                            <span className="sidebar-menu-text">Liste Réalisation</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/listRealisationCloture"
                            className={`sidebar-menu-link ${isActive("/listRealisationCloture")}`}
                            onClick={closeMobileSidebar}
                        >
                            <span className="material-icons">lock</span>
                            <span className="sidebar-menu-text">Clôture</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/listbonprecommande"
                            className={`sidebar-menu-link ${isActive("/listbonprecommande")}`}
                            onClick={closeMobileSidebar}
                        >
                            <span className="material-icons">receipt_long</span>
                            <span className="sidebar-menu-text">Bon Précommande</span>
                        </Link>
                    </li>

                    <li>
                        <Link
                            to="/profil"
                            className={`sidebar-menu-link ${isActive("/profil")}`}
                            onClick={closeMobileSidebar}
                        >
                            <span className="material-icons">settings</span>
                            <span className="sidebar-menu-text">Profil</span>
                        </Link>
                    </li>
                </ul>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {users[0]?.user_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">
                                {users[0]?.user_name || "Utilisateur"}
                            </div>
                            <div className="sidebar-user-role">Employé</div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
                <h1>Bonjour 👋</h1>

                {users.map(u => (
                    <p key={u.user_id}>Bienvenue {u.user_name}</p>
                ))}

                {error && <p style={{ color: "red" }}>{error}</p>}
            </main>
        </>
    );
}

export default Utilisateur;
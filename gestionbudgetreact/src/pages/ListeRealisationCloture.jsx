import { useState, useEffect } from "react";
import { ListRealisationaCloture, RealisationCloture } from "../services/api";

function ListeRealisationCloture() {
    const [realisation, setRealisation] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filterStatus, setFilterStatus] = useState("tous");
    const [message, setMessage] = useState("");
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await ListRealisationaCloture();
                setRealisation(data);
                
                // DEBUG : Afficher tous les statuts reçus
                console.log("=== RÉALISATIONS REÇUES ===");
                data.forEach(r => {
                    console.log(`ID ${r.real_id}: "${r.etat?.etatp_name}"`);
                });
            } catch (error) {
                setMessage(error.message);
            }
        };
        fetchData();
    }, []);

    const openDetailModal = (real) => {
        setSelected({ ...real });
        setShowDetailModal(true);
    };

    const closeModals = () => {
        setShowDetailModal(false);
        setSelected(null);
    };

    const handleRealisation = async (realId) => {
        try {
            console.log("Clôture Real ID:", realId);

            const data = await RealisationCloture(realId);
            setMessage("✅ Clôture Réalisation réussie !");

            setRealisation((prev) =>
                prev.map((r) => (r.real_id === data.real_id ? data : r))
            );

            closeModals();
        } catch (error) {
            console.error("=== ERREUR DÉTAILLÉE ===");
            console.error("Message:", error.message);
            console.error("Response Status:", error.response?.status);
            console.error("Response Data:", error.response?.data);

            setMessage("❌ Erreur : " + (error.response?.data?.message || error.message));
        }
    };

    // ✅ FONCTION DE NORMALISATION (même que ListePlannification)
    const normalizeStatus = (status) => {
        if (!status) return "";
        return status
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    // ✅ FONCTION pour les badges
    const getStatusBadge = (etatpName) => {
        const normalized = normalizeStatus(etatpName);
        
        if (normalized === "valide") {
            return "badge-success";
        }
        
        if (normalized === "non valide" || normalized === "en attente") {
            return "badge-warning";
        }
        
        if (normalized === "rejete") {
            return "badge-danger";
        }
        
        return "badge-info";
    };

    // ✅ FONCTION pour les couleurs
    const getStatusColor = (etatpName) => {
        const normalized = normalizeStatus(etatpName);
        
        if (normalized === "valide") {
            return "#10b981";
        }
        
        if (normalized === "non valide" || normalized === "en attente") {
            return "#f59e0b";
        }
        
        if (normalized === "rejete") {
            return "#ef4444";
        }
        
        return "#6b7280";
    };

    // ✅ FONCTION pour les icônes
    const getStatusIcon = (etatpName) => {
        const normalized = normalizeStatus(etatpName);
        
        if (normalized === "valide") {
            return "✓";
        }
        
        if (normalized === "non valide" || normalized === "en attente") {
            return "⏳";
        }
        
        if (normalized === "rejete") {
            return "✕";
        }
        
        return "•";
    };

    // ✅ FONCTION pour le texte d'affichage
    const getStatusText = (etatpName) => {
        if (!etatpName) return "Inconnu";
        
        const normalized = normalizeStatus(etatpName);
        
        if (normalized === "valide") {
            return "Validé";
        }
        
        if (normalized === "non valide") {
            return "Non validé";
        }
        
        if (normalized === "rejete") {
            return "Rejeté";
        }
        
        if (normalized === "en attente") {
            return "En attente";
        }
        
        return etatpName;
    };

    // ✅ FILTRE CORRIGÉ
    const filteredRealisation = realisation.filter(r => {
        if (filterStatus === "tous") return true;
        
        if (!r.etat?.etatp_name) return false;
        
        const statusNormalized = normalizeStatus(r.etat.etatp_name);
        const filterNormalized = normalizeStatus(filterStatus);
        
        return statusNormalized === filterNormalized;
    });

    const maxMontant = filteredRealisation.length > 0
        ? Math.max(...filteredRealisation.map(r => r.real_montantreel || 0))
        : 0;

    return (
        <div style={{ padding: "40px" }}>
            <h1>Liste des Réalisations a cloturé</h1>
            {message && <p className="message message-info">{message}</p>}

            {/* Section Graphique */}
            {realisation.length > 0 && (
                <div style={{
                    background: "white",
                    padding: "30px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    marginBottom: "30px"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                        flexWrap: "wrap",
                        gap: "15px"
                    }}>
                        <h2 style={{ fontSize: "20px", color: "#333", margin: 0 }}>
                            📊 Graphique des Montants Réels de Réalisation
                        </h2>

                        {/* Boutons de filtre */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <button
                                onClick={() => setFilterStatus("tous")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: filterStatus === "tous" ? "2px solid #3b82f6" : "1px solid #ddd",
                                    background: filterStatus === "tous" ? "#3b82f6" : "white",
                                    color: filterStatus === "tous" ? "white" : "#333",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    transition: "all 0.2s"
                                }}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setFilterStatus("validé")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: filterStatus === "validé" ? "2px solid #10b981" : "1px solid #ddd",
                                    background: filterStatus === "validé" ? "#10b981" : "white",
                                    color: filterStatus === "validé" ? "white" : "#333",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    transition: "all 0.2s"
                                }}
                            >
                                ✓ Validé
                            </button>
                            <button
                                onClick={() => setFilterStatus("non validé")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: filterStatus === "non validé" ? "2px solid #f59e0b" : "1px solid #ddd",
                                    background: filterStatus === "non validé" ? "#f59e0b" : "white",
                                    color: filterStatus === "non validé" ? "white" : "#333",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    transition: "all 0.2s"
                                }}
                            >
                                ⏳ Non validé
                            </button>
                            <button
                                onClick={() => setFilterStatus("rejeté")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: filterStatus === "rejeté" ? "2px solid #ef4444" : "1px solid #ddd",
                                    background: filterStatus === "rejeté" ? "#ef4444" : "white",
                                    color: filterStatus === "rejeté" ? "white" : "#333",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    transition: "all 0.2s"
                                }}
                            >
                                ✕ Rejeté
                            </button>
                        </div>
                    </div>

                    {filteredRealisation.length === 0 ? (
                        <div style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#999",
                            fontSize: "16px"
                        }}>
                            Aucune réalisation avec le statut "{filterStatus}"
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: "15px",
                                height: "350px",
                                padding: "20px",
                                borderBottom: "2px solid #333",
                                borderLeft: "2px solid #333",
                                position: "relative"
                            }}>
                                {filteredRealisation.map((r) => {
                                    const height = maxMontant > 0 ? (r.real_montantreel / maxMontant) * 100 : 0;
                                    return (
                                        <div
                                            key={r.real_id}
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "10px",
                                                position: "relative"
                                            }}
                                        >
                                            {/* Barre */}
                                            <div
                                                style={{
                                                    width: "100%",
                                                    maxWidth: "80px",
                                                    height: `${height}%`,
                                                    background: `linear-gradient(to top, ${getStatusColor(r.etat?.etatp_name)}, ${getStatusColor(r.etat?.etatp_name)}dd)`,
                                                    borderRadius: "8px 8px 0 0",
                                                    transition: "all 0.3s ease",
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                                    position: "relative"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = "scaleY(1.05)";
                                                    e.currentTarget.style.filter = "brightness(1.1)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = "scaleY(1)";
                                                    e.currentTarget.style.filter = "brightness(1)";
                                                }}
                                                title={`${r.prod_name}: ${r.real_montantreel?.toLocaleString('fr-FR')} Ar`}
                                            >
                                                {/* Montant au-dessus de la barre */}
                                                <div style={{
                                                    position: "absolute",
                                                    top: "-25px",
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    fontSize: "11px",
                                                    fontWeight: "bold",
                                                    color: "#333",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {(r.real_montantreel / 1000).toFixed(0)}k
                                                </div>
                                            </div>

                                            {/* Nom du produit */}
                                            <div style={{
                                                fontSize: "12px",
                                                textAlign: "center",
                                                color: "#666",
                                                fontWeight: "500",
                                                maxWidth: "80px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {r.prod_name}
                                            </div>

                                            {/* Badge statut */}
                                            <div style={{
                                                fontSize: "10px",
                                                padding: "4px 8px",
                                                borderRadius: "8px",
                                                background: getStatusColor(r.etat?.etatp_name) + "20",
                                                color: getStatusColor(r.etat?.etatp_name),
                                                fontWeight: "600",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}>
                                                <span>{getStatusIcon(r.etat?.etatp_name)}</span>
                                                <span>{getStatusText(r.etat?.etatp_name)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Statistiques */}
                            <div style={{
                                marginTop: "20px",
                                padding: "15px",
                                background: "#f9fafb",
                                borderRadius: "6px",
                                display: "flex",
                                justifyContent: "space-around",
                                flexWrap: "wrap",
                                gap: "15px"
                            }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Nombre</div>
                                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
                                        {filteredRealisation.length}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Total Réalisé</div>
                                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#10b981" }}>
                                        {filteredRealisation.reduce((sum, r) => sum + (r.real_montantreel || 0), 0).toLocaleString('fr-FR')} Ar
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Moyenne</div>
                                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}>
                                        {filteredRealisation.length > 0
                                            ? Math.round(filteredRealisation.reduce((sum, r) => sum + (r.real_montantreel || 0), 0) / filteredRealisation.length).toLocaleString('fr-FR')
                                            : 0} Ar
                                    </div>
                                </div>
                            </div>

                            {/* Légende */}
                            <div style={{
                                marginTop: "20px",
                                display: "flex",
                                gap: "20px",
                                justifyContent: "center",
                                flexWrap: "wrap"
                            }}>
                                {[
                                    { label: "Validé", color: "#10b981", icon: "✓" },
                                    { label: "Non validé", color: "#f59e0b", icon: "⏳" },
                                    { label: "Rejeté", color: "#ef4444", icon: "✕" }
                                ].map((item) => (
                                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                            width: "16px",
                                            height: "16px",
                                            background: item.color,
                                            borderRadius: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            fontSize: "10px",
                                            fontWeight: "bold"
                                        }}>
                                            {item.icon}
                                        </div>
                                        <span style={{ fontSize: "14px", color: "#666" }}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Montant Total Realisation</th>
                            <th>Prix Unitaire Realisation</th>
                            <th>Prix Unitaire Plannification</th>
                            <th>Quantité</th>
                            <th>Montant Total Plannification</th>
                            <th className="text-center">Statut</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {realisation.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-cell">
                                    Aucune Réalisation trouvée
                                </td>
                            </tr>
                        ) : (
                            realisation.map((r) => (
                                <tr
                                    key={r.real_id}
                                    onClick={() => openDetailModal(r)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>{r.prod_name}</td>
                                    <td>{r.real_montantreel?.toLocaleString("fr-FR")} Ar</td>
                                    <td>{r.real_prixunitaire?.toLocaleString("fr-FR")} Ar</td>
                                    <td>{r.plan_prixunitaire?.toLocaleString("fr-FR")} Ar</td>
                                    <td>{r.plan_nombredemande}</td>
                                    <td>{r.plan_montanttotal?.toLocaleString("fr-FR")} Ar</td>
                                    <td className="text-center">
                                        <span
                                            className={`badge ${getStatusBadge(r.etat?.etatp_name)}`}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            <span>{getStatusIcon(r.etat?.etatp_name)}</span>
                                            <span>{getStatusText(r.etat?.etatp_name)}</span>
                                        </span>
                                    </td>
                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="table-actions">
                                            <button
                                                className="btn-primary"
                                                onClick={() => handleRealisation(r.real_id)}
                                            >
                                                Clôturer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Détails */}
            {showDetailModal && selected && (
                <>
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(0, 0, 0, 0.5)",
                            zIndex: 999,
                        }}
                        onClick={closeModals}
                    />

                    <div
                        style={{
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "90%",
                            maxWidth: "500px",
                            background: "white",
                            borderRadius: "8px",
                            padding: "30px",
                            zIndex: 1000,
                            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <h2>Détail Réalisation</h2>

                        <div className="form-group">
                            <label>Produit:</label>
                            <p style={{ margin: "5px 0", fontWeight: "500" }}>
                                {selected.prod_name}
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Montant Réel:</label>
                            <p style={{ margin: "5px 0", fontWeight: "500" }}>
                                {selected.real_montantreel?.toLocaleString('fr-FR')} Ar
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Prix Unitaire Réalisation:</label>
                            <p style={{ margin: "5px 0", fontWeight: "500" }}>
                                {selected.real_prixunitaire?.toLocaleString('fr-FR')} Ar
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Prix Unitaire Plannification:</label>
                            <p style={{ margin: "5px 0", fontWeight: "500" }}>
                                {selected.plan_prixunitaire?.toLocaleString('fr-FR')} Ar
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Quantité:</label>
                            <p style={{ margin: "5px 0", fontWeight: "500" }}>
                                {selected.plan_nombredemande}
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Montant Total Plannification:</label>
                            <p style={{ margin: "5px 0", fontWeight: "500" }}>
                                {selected.plan_montanttotal?.toLocaleString('fr-FR')} Ar
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Statut:</label>
                            <p style={{ margin: "5px 0" }}>
                                <span 
                                    className={`badge ${getStatusBadge(selected.etat?.etatp_name)}`}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                >
                                    <span>{getStatusIcon(selected.etat?.etatp_name)}</span>
                                    <span>{getStatusText(selected.etat?.etatp_name)}</span>
                                </span>
                            </p>
                        </div>

                        <div className="button-group">
                            <button className="btn-primary" onClick={closeModals}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ListeRealisationCloture;
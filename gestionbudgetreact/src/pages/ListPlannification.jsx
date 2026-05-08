import { useState, useEffect } from "react";
import { ListPlannification, updatePlannification } from "../services/api";

function ListePlannification() {
    const [plannifications, setPlannifications] = useState([]);
    const [message, setMessage] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [filterStatus, setFilterStatus] = useState("tous");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await ListPlannification();
                setPlannifications(data);
            } catch (error) {
                setMessage(error.message);
            }
        };
        fetchData();
    }, []);

    const openEditModal = (plannif) => {
        setSelected({ ...plannif });
        setShowEditModal(true);
    };

    const openDetailModal = (plannif) => {
        setSelected({ ...plannif });
        setShowDetailModal(true);
    };

    const closeModals = () => {
        setShowEditModal(false);
        setShowDetailModal(false);
        setSelected(null);
    };

    const handleUpdate = async () => {
        try {
            const updated = await updatePlannification(selected.plan_id, selected);
            setMessage("Planification mise à jour avec succès");

            setPlannifications((prev) =>
                prev.map((p) => (p.plan_id === updated.plan_id ? updated : p))
            );

            closeModals();
        } catch (error) {
            setMessage(error.message);
        }
    };

    const normalizeStatus = (status) => {
        if (!status) return "";
        return status
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    const getEtatName = (plannif) => {
        return plannif?.etat_nameplannification || plannif?.etat_name || plannif?.etatp_name || plannif?.etat?.etatp_name || "";
    };

    const getStatusBadge = (etatpName) => {
        const normalized = normalizeStatus(etatpName);
        
        if (normalized === "valide") return "badge-success";
        if (normalized === "non valide" || normalized === "en attente") return "badge-warning";
        if (normalized === "rejete") return "badge-danger";
        
        return "badge-info";
    };

    const getStatusText = (etatpName) => {
        if (!etatpName) return "Inconnu";
        
        const normalized = normalizeStatus(etatpName);
        
        if (normalized === "valide") return "Validé";
        if (normalized === "non valide") return "Non validé";
        if (normalized === "rejete") return "Rejeté";
        if (normalized === "en attente") return "En attente";
        
        return etatpName;
    };

    const filteredPlannifications = plannifications.filter(p => {
        if (filterStatus === "tous") return true;
        const etatName = getEtatName(p);
        if (!etatName) return false;
        
        const statusNormalized = normalizeStatus(etatName);
        const filterNormalized = normalizeStatus(filterStatus);
        
        return statusNormalized === filterNormalized;
    });

    const maxMontant = filteredPlannifications.length > 0 
        ? Math.max(...filteredPlannifications.map(p => p.plan_montanttotal || 0))
        : 0;

    return (
        <div style={{ padding: "40px" }}>
            <h1>Liste des Planifications</h1>
            {message && <p className="message message-info">{message}</p>}

            {plannifications.length > 0 && (
                <div style={{
                    background: "white",
                    padding: "24px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                    border: "1px solid #e5e7eb"
                }}>
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "20px",
                        flexWrap: "wrap",
                        gap: "15px"
                    }}>
                        <h2 style={{ fontSize: "18px", color: "#111827", margin: 0, fontWeight: "600" }}>
                            Graphique des Montants Totaux
                        </h2>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {["tous", "validé", "non validé", "rejeté"].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "6px",
                                        border: "1px solid #d1d5db",
                                        background: filterStatus === status ? "#f3f4f6" : "white",
                                        color: "#374151",
                                        cursor: "pointer",
                                        fontWeight: filterStatus === status ? "500" : "400",
                                        fontSize: "13px",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => {
                                        if (filterStatus !== status) {
                                            e.target.style.background = "#f9fafb";
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (filterStatus !== status) {
                                            e.target.style.background = "white";
                                        }
                                    }}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {filteredPlannifications.length === 0 ? (
                        <div style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#9ca3af",
                            fontSize: "14px"
                        }}>
                            Aucune plannification avec le statut "{filterStatus}"
                        </div>
                    ) : (
                        <>
                            <div style={{ 
                                display: "flex", 
                                alignItems: "flex-end", 
                                gap: "12px",
                                height: "300px",
                                padding: "20px",
                                borderBottom: "1px solid #e5e7eb",
                                borderLeft: "1px solid #e5e7eb",
                                position: "relative"
                            }}>
                                {filteredPlannifications.map((p) => {
                                    const height = maxMontant > 0 ? (p.plan_montanttotal / maxMontant) * 100 : 0;
                                    return (
                                        <div 
                                            key={p.plan_id}
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "8px",
                                                position: "relative"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "100%",
                                                    maxWidth: "60px",
                                                    height: `${height}%`,
                                                    background: "#e5e7eb",
                                                    borderRadius: "4px 4px 0 0",
                                                    transition: "all 0.2s ease",
                                                    cursor: "pointer",
                                                    position: "relative"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = "#d1d5db";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = "#e5e7eb";
                                                }}
                                                title={`${p.prod_name}: ${p.plan_montanttotal?.toLocaleString('fr-FR')} Ar`}
                                            >
                                                <div style={{
                                                    position: "absolute",
                                                    top: "-22px",
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    fontSize: "11px",
                                                    fontWeight: "500",
                                                    color: "#374151",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {(p.plan_montanttotal / 1000).toFixed(0)}k
                                                </div>
                                            </div>
                                            
                                            <div style={{
                                                fontSize: "11px",
                                                textAlign: "center",
                                                color: "#6b7280",
                                                fontWeight: "400",
                                                maxWidth: "70px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {p.prod_name}
                                            </div>

                                            <div style={{
                                                fontSize: "10px",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                background: "#f3f4f6",
                                                color: "#6b7280",
                                                fontWeight: "500"
                                            }}>
                                                {getStatusText(getEtatName(p))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{
                                marginTop: "16px",
                                padding: "12px",
                                background: "#f9fafb",
                                borderRadius: "6px",
                                display: "flex",
                                justifyContent: "space-around",
                                flexWrap: "wrap",
                                gap: "12px",
                                border: "1px solid #e5e7eb"
                            }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                                        Nombre
                                    </div>
                                    <div style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                                        {filteredPlannifications.length}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                                        Total
                                    </div>
                                    <div style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                                        {filteredPlannifications
                                            .reduce((sum, p) => sum + (p.plan_montanttotal || 0), 0)
                                            .toLocaleString('fr-FR')} Ar
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                                        Moyenne
                                    </div>
                                    <div style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                                        {filteredPlannifications.length > 0 
                                            ? Math.round(
                                                filteredPlannifications.reduce((sum, p) => sum + (p.plan_montanttotal || 0), 0) / 
                                                filteredPlannifications.length
                                            ).toLocaleString('fr-FR')
                                            : 0} Ar
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Produit</th>
                            <th>Prix Unitaire</th>
                            <th>Quantité</th>
                            <th>Montant Total</th>
                            <th className="text-center">Statut</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plannifications.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-cell">
                                    Aucune plannification trouvée
                                </td>
                            </tr>
                        ) : (
                            plannifications.map((p) => (
                                <tr 
                                    key={p.plan_id}
                                    onClick={() => openDetailModal(p)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>{p.plan_id}</td>
                                    <td>{p.prod_name}</td>
                                    <td>{p.plan_prixunitaire?.toLocaleString('fr-FR') || "0"} Ar</td>
                                    <td>{p.plan_nombredemande || 0}</td>
                                    <td>{p.plan_montanttotal?.toLocaleString('fr-FR') || "0"} Ar</td>
                                    <td className="text-center">
                                        <span className={`badge ${getStatusBadge(getEtatName(p))}`}>
                                            {getStatusText(getEtatName(p))}
                                        </span>
                                    </td>
                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="table-actions">
                                            <button className="btn-primary" onClick={() => openEditModal(p)}>
                                                Modifier
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showEditModal && selected && (
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
                        <h2>Modifier Plannification</h2>

                        <div className="form-group">
                            <label>Produit ID:</label>
                            <input
                                type="number"
                                value={selected.plan_produitid || ""}
                                onChange={(e) =>
                                    setSelected({ ...selected, plan_produitid: parseInt(e.target.value, 10) })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Prix Unitaire:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={selected.plan_prixunitaire || ""}
                                onChange={(e) =>
                                    setSelected({ ...selected, plan_prixunitaire: parseFloat(e.target.value) })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Nombre Demande:</label>
                            <input
                                type="number"
                                value={selected.plan_nombredemande || ""}
                                onChange={(e) =>
                                    setSelected({ ...selected, plan_nombredemande: parseInt(e.target.value, 10) })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Description:</label>
                            <textarea
                                value={selected.plan_description || ""}
                                onChange={(e) =>
                                    setSelected({ ...selected, plan_description: e.target.value })
                                }
                                rows={4}
                            />
                        </div>

                        <div className="button-group">
                            <button className="btn-primary" onClick={handleUpdate}>
                                Enregistrer
                            </button>
                            <button className="btn-danger" onClick={closeModals}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </>
            )}

            {showDetailModal && selected && (
                <>
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(0, 0, 0, 0.6)",
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
                            maxWidth: "600px",
                            maxHeight: "85vh",
                            background: "white",
                            borderRadius: "12px",
                            zIndex: 1000,
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden"
                        }}
                    >
                        <div style={{
                            padding: "24px 32px",
                            borderBottom: "1px solid #e5e7eb",
                            background: "#ffffff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h2 style={{ margin: 0, color: "#1f2937", fontSize: "20px", fontWeight: "600" }}>
                                Détails Plannification #{selected.plan_id}
                            </h2>
                            <button 
                                onClick={closeModals}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#6b7280",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = "#f3f4f6";
                                    e.target.style.color = "#111827";
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = "transparent";
                                    e.target.style.color = "#6b7280";
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{
                            padding: "32px",
                            overflowY: "auto",
                            flex: 1
                        }}>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "24px",
                                marginBottom: "24px"
                            }}>
                                <div>
                                    <label style={{ 
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "6px"
                                    }}>
                                        Référence
                                    </label>
                                    <p style={{ 
                                        margin: 0,
                                        fontSize: "16px",
                                        color: "#111827",
                                        fontWeight: "500"
                                    }}>
                                        {selected.plan_ref || "N/A"}
                                    </p>
                                </div>

                                <div>
                                    <label style={{ 
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "6px"
                                    }}>
                                        Produit
                                    </label>
                                    <p style={{ 
                                        margin: 0,
                                        fontSize: "16px",
                                        color: "#111827",
                                        fontWeight: "500"
                                    }}>
                                        {selected.prod_name || "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                marginBottom: "24px"
                            }}>
                                <label style={{ 
                                    display: "block",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    color: "#6b7280",
                                    marginBottom: "6px"
                                }}>
                                    Statut
                                </label>
                                <span className={`badge ${getStatusBadge(getEtatName(selected))}`}>
                                    {getStatusText(getEtatName(selected))}
                                </span>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "16px",
                                marginBottom: "24px"
                            }}>
                                <div style={{
                                    padding: "16px",
                                    background: "#f9fafb",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb"
                                }}>
                                    <label style={{ 
                                        display: "block",
                                        fontSize: "12px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "4px"
                                    }}>
                                        Prix Unitaire
                                    </label>
                                    <p style={{ 
                                        margin: 0,
                                        fontSize: "18px",
                                        color: "#111827",
                                        fontWeight: "600"
                                    }}>
                                        {selected.plan_prixunitaire?.toLocaleString('fr-FR') || "0"} Ar
                                    </p>
                                </div>

                                <div style={{
                                    padding: "16px",
                                    background: "#f9fafb",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb"
                                }}>
                                    <label style={{ 
                                        display: "block",
                                        fontSize: "12px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "4px"
                                    }}>
                                        Quantité
                                    </label>
                                    <p style={{ 
                                        margin: 0,
                                        fontSize: "18px",
                                        color: "#111827",
                                        fontWeight: "600"
                                    }}>
                                        {selected.plan_nombredemande || 0}
                                    </p>
                                </div>

                                <div style={{
                                    padding: "16px",
                                    background: "#f9fafb",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb"
                                }}>
                                    <label style={{ 
                                        display: "block",
                                        fontSize: "12px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "4px"
                                    }}>
                                        Montant Total
                                    </label>
                                    <p style={{ 
                                        margin: 0,
                                        fontSize: "18px",
                                        color: "#111827",
                                        fontWeight: "600"
                                    }}>
                                        {selected.plan_montanttotal?.toLocaleString('fr-FR') || "0"} Ar
                                    </p>
                                </div>
                            </div>

                            {selected.plan_description && (
                                <div>
                                    <label style={{ 
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "8px"
                                    }}>
                                        Description
                                    </label>
                                    <p style={{ 
                                        margin: 0,
                                        padding: "12px",
                                        background: "#f9fafb",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        color: "#374151",
                                        lineHeight: "1.6",
                                        border: "1px solid #e5e7eb"
                                    }}>
                                        {selected.plan_description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: "16px 32px",
                            borderTop: "1px solid #e5e7eb",
                            background: "#f9fafb",
                            display: "flex",
                            justifyContent: "flex-end"
                        }}>
                            <button 
                                className="btn-primary" 
                                onClick={closeModals}
                                style={{
                                    padding: "10px 24px",
                                    fontSize: "14px"
                                }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ListePlannification;
import { useState, useEffect } from "react";
import { ListBonprecommandeavalider, ValidationBonprecommande } from "../services/api";

function ListeBonPrecommande() {
    const [Bonprecommande, setBonPrecommande] = useState([]);
    const [message, setMessage] = useState("");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [filterStatus, setFilterStatus] = useState("tous");

    // États pour le modal de validation
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationImage, setValidationImage] = useState(null);
    const [validationDescription, setValidationDescription] = useState("");
    const [selectedForValidation, setSelectedForValidation] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await ListBonprecommandeavalider();
                setBonPrecommande(data);

                // 🔍 DEBUG : Afficher tous les statuts reçus
                console.log("=== Bon Precommande REÇUES ===");
                data.forEach(p => {
                    console.log(`ID ${p.bon_id}: "${p.etatp_name}"`);
                });
            } catch (error) {
                setMessage(error.message);
            }
        };
        fetchData();
    }, []);

    // 🔍 DEBUG : Tracker l'état du modal de validation
    useEffect(() => {
        if (showValidationModal) {
            console.log("=== MODAL DE VALIDATION OUVERT ===");
            console.log("selectedForValidation:", selectedForValidation);
            console.log("validationDescription:", validationDescription);
            console.log("validationImage:", validationImage);
            console.log("isValidating:", isValidating);
            console.log("Bouton désactivé ?", !validationDescription.trim() || isValidating);
        }
    }, [showValidationModal, validationDescription, validationImage, isValidating, selectedForValidation]);

    const openDetailModal = (bon) => {
        setSelected({ ...bon });
        setShowDetailModal(true);
    };

    const closeModals = () => {
        setShowDetailModal(false);
        setSelected(null);
    };

    // Ouvrir le modal de validation
    const openValidationModal = (bon) => {
        setSelectedForValidation(bon);
        setValidationImage(null);
        setValidationDescription("");
        setShowValidationModal(true);
    };

    // Fonction de validation finale
    const handleUpdate = async () => {
        console.log("=== DÉBUT handleUpdate ===");
        console.log("selectedForValidation:", selectedForValidation);
        console.log("validationDescription:", validationDescription);
        console.log("validationImage:", validationImage);

        try {
            // Vérifier que la description est remplie
            if (!validationDescription.trim()) {
                console.error("❌ Description vide");
                setMessage("Erreur: La description est obligatoire");
                return;
            }

            // CORRECTION: Utiliser plan_id car V_BonPrecommandes retourne plan_id, pas bon_id
            if (!selectedForValidation || !selectedForValidation.plan_id) {
                console.error("❌ Aucune précommande sélectionnée");
                setMessage("Erreur: Aucune précommande sélectionnée");
                return;
            }

            console.log("✅ Validations OK, début de l'envoi");
            setIsValidating(true);

            let dataToSend;

            // Si une image est uploadée, utiliser FormData
            if (validationImage) {
                const formData = new FormData();
                formData.append('bon_dlprixunitaire', selectedForValidation.plan_prixunitaire);
                formData.append('bon_dlqte', selectedForValidation.plan_nombredemande);
                formData.append('real_description', validationDescription);
                formData.append('real_image', validationImage); // Le fichier complet
                dataToSend = formData;

                console.log("📤 Envoi avec image (FormData)");
                console.log("   - Prix unitaire:", selectedForValidation.plan_prixunitaire);
                console.log("   - Quantité:", selectedForValidation.plan_nombredemande);
                console.log("   - Description:", validationDescription);
                console.log("   - Image:", validationImage.name);
            } else {
                // Sans image, envoyer JSON
                dataToSend = {
                    bon_dlprixunitaire: selectedForValidation.plan_prixunitaire,
                    bon_dlqte: selectedForValidation.plan_nombredemande,
                    real_description: validationDescription,
                    real_image: null
                };

                console.log("📤 Envoi sans image (JSON):", dataToSend);
            }

            // CORRECTION: Utiliser plan_id car c'est ce que la vue retourne
            console.log("📤 ID de la précommande:", selectedForValidation.plan_id);

            const updated = await ValidationBonprecommande(
                selectedForValidation.plan_id,
                dataToSend
            );

            console.log("✅ Réponse de l'API:", updated);

            setMessage("Bon de Précommande validé avec succès");

            // Mettre à jour la liste
            setBonPrecommande((prev) =>
                prev.map((p) => (p.plan_id === updated.plan_id ? updated : p))
            );

            // Fermer tous les modals et réinitialiser
            setShowValidationModal(false);
            setValidationImage(null);
            setValidationDescription("");
            setSelectedForValidation(null);

            setTimeout(() => setMessage(""), 3000);

        } catch (error) {
            console.error("❌ ERREUR COMPLÈTE:", error);
            console.error("❌ Message d'erreur:", error.message);
            console.error("❌ Réponse du serveur:", error.response);
            setMessage(`Erreur: ${error.response?.data?.message || error.message || "Impossible de valider le bon"}`);
        } finally {
            setIsValidating(false);
            console.log("=== FIN handleUpdate ===");
        }
    };

    // ✅ FONCTION CORRIGÉE - Normalise les accents et espaces
    const normalizeStatus = (status) => {
        if (!status) return "";
        return status
            .toLowerCase()
            .trim()
            .normalize("NFD") // Décompose les caractères accentués
            .replace(/[\u0300-\u036f]/g, ""); // Supprime les accents
    };

    // ✅ FONCTION pour les badges
    const getStatusBadge = (etatpName) => {
        const normalized = normalizeStatus(etatpName);

        console.log("Badge - Original:", etatpName, "→ Normalisé:", normalized);

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
            return "#10b981"; // Vert
        }

        if (normalized === "non valide" || normalized === "en attente") {
            return "#f59e0b"; // Orange
        }

        if (normalized === "rejete") {
            return "#ef4444"; // Rouge
        }

        return "#6b7280"; // Gris
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
    const filteredBonprecommande = Bonprecommande.filter(p => {
        if (filterStatus === "tous") return true;

        if (!p.etatp_name) return false;

        const statusNormalized = normalizeStatus(p.etatp_name);
        const filterNormalized = normalizeStatus(filterStatus);

        return statusNormalized === filterNormalized;
    });

    const maxMontant = filteredBonprecommande.length > 0
        ? Math.max(...filteredBonprecommande.map(p => p.bon_dlmontantttc || 0))
        : 0;

    return (
        <div style={{ padding: "40px" }}>
            <h1>Liste des Bon de Precommande</h1>
            {message && <p className="message message-info">{message}</p>}

            {/* Section Graphique */}
            {Bonprecommande.length > 0 && (
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
                            📊 Graphique des Montants Totaux
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

                    {filteredBonprecommande.length === 0 ? (
                        <div style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#999",
                            fontSize: "16px"
                        }}>
                            Aucune Bon Precommande avec le statut "{filterStatus}"
                        </div>
                    ) : (
                        <>
                            {/* Graphique à barres */}
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
                                {filteredBonprecommande.map((p) => {
                                    const height = maxMontant > 0 ? (p.bon_montanttc / maxMontant) * 100 : 0;
                                    return (
                                        <div
                                            key={p.plan_id}
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
                                                    background: `linear-gradient(to top, ${getStatusColor(p.etatp_name)}, ${getStatusColor(p.etatp_name)}dd)`,
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
                                                title={`${p.prod_name}: ${p.plan_montanttotal?.toLocaleString('fr-FR')} Ar`}
                                            >
                                                {/* Montant au-dessus */}
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
                                                    {(p.plan_montanttotal / 1000).toFixed(0)}k
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
                                                {p.prod_name}
                                            </div>

                                            {/* Badge statut */}
                                            <div style={{
                                                fontSize: "10px",
                                                padding: "4px 8px",
                                                borderRadius: "8px",
                                                background: getStatusColor(p.etatp_name) + "20",
                                                color: getStatusColor(p.etatp_name),
                                                fontWeight: "600",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}>
                                                <span>{getStatusIcon(p.etatp_name)}</span>
                                                <span>{getStatusText(p.etatp_name)}</span>
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
                                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                                        Nombre
                                    </div>
                                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
                                        {filteredBonprecommande.length}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                                        Total
                                    </div>
                                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#10b981" }}>
                                        {filteredBonprecommande
                                            .reduce((sum, p) => sum + (p.plan_montanttotal || 0), 0)
                                            .toLocaleString('fr-FR')} Ar
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                                        Moyenne
                                    </div>
                                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}>
                                        {filteredBonprecommande.length > 0
                                            ? Math.round(
                                                filteredBonprecommande.reduce((sum, p) => sum + (p.plan_montanttotal || 0), 0) /
                                                filteredBonprecommande.length
                                            ).toLocaleString('fr-FR')
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
                                    <div
                                        key={item.label}
                                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                    >
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
                                        <span style={{ fontSize: "14px", color: "#666" }}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Tableau */}
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
                        {Bonprecommande.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-cell">
                                    Aucune Bon PreCommande trouvée
                                </td>
                            </tr>
                        ) : (
                            Bonprecommande.map((p) => (
                                <tr
                                    key={p.plan_id}
                                    onClick={() => openDetailModal(p)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>{p.plan_id}</td>
                                    <td>{p.prod_name}</td>
                                    <td>{p.bon_dlprixunitaire?.toLocaleString('fr-FR')} Ar</td>
                                    <td>{p.bon_dlqte}</td>
                                    <td>{p.bon_dlprixunitaire*p.bon_dlqte?.toLocaleString('fr-FR')} Ar</td>
                                    <td className="text-center">
                                        <span
                                            className={`badge ${getStatusBadge(p.etatp_name)}`}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            <span>{getStatusIcon(p.etatp_name)}</span>
                                            <span>{getStatusText(p.etatp_name)}</span>
                                        </span>
                                    </td>
                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="table-actions">
                                            <button
                                                className="btn-primary"
                                                onClick={() => openValidationModal(p)}
                                            >
                                                Valider
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Validation */}
            {showValidationModal && selectedForValidation && (
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
                        onClick={() => setShowValidationModal(false)}
                    />

                    <div
                        style={{
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "90%",
                            maxWidth: "550px",
                            background: "white",
                            borderRadius: "8px",
                            zIndex: 1000,
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                            overflow: "hidden"
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: "24px 28px",
                            borderBottom: "1px solid #e5e7eb",
                            background: "white"
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#111827"
                            }}>
                                Validation de la Précommande
                            </h2>
                            <p style={{
                                margin: "6px 0 0 0",
                                fontSize: "14px",
                                color: "#6b7280"
                            }}>
                                {selectedForValidation.prod_name} - {selectedForValidation.plan_montanttotal?.toLocaleString('fr-FR')} Ar
                            </p>
                        </div>

                        {/* Content */}
                        <div style={{ padding: "28px" }}>
                            {/* Upload Image */}
                            <div className="form-group" style={{ marginBottom: "24px" }}>
                                <label style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#374151",
                                    marginBottom: "8px"
                                }}>
                                    Image {validationImage && <span style={{ color: "#6b7280", fontWeight: "normal" }}>(fichier sélectionné)</span>}
                                </label>
                                <input
                                    type="file"
                                    className="custom-file-input"
                                    onChange={(e) => setValidationImage(e.target.files[0])}
                                    accept="image/*"
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        background: "#f9fafb"
                                    }}
                                />
                                {validationImage && (
                                    <small style={{
                                        color: "#6b7280",
                                        display: "block",
                                        marginTop: "6px",
                                        fontSize: "13px"
                                    }}>
                                        📎 {validationImage.name}
                                    </small>
                                )}
                            </div>

                            {/* Description */}
                            <div className="form-group" style={{ marginBottom: "24px" }}>
                                <label style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#374151",
                                    marginBottom: "8px"
                                }}>
                                    Description <span style={{ color: "#dc2626" }}>*</span>
                                </label>
                                <textarea
                                    value={validationDescription}
                                    onChange={(e) => {
                                        console.log("📝 Description changée:", e.target.value);
                                        console.log("📝 Longueur:", e.target.value.length);
                                        setValidationDescription(e.target.value);
                                    }}
                                    rows={5}
                                    placeholder="Ajoutez une note concernant cette validation..."
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        fontFamily: "inherit",
                                        resize: "vertical",
                                        lineHeight: "1.5"
                                    }}
                                />
                                {!validationDescription.trim() && (
                                    <small style={{
                                        color: "#9ca3af",
                                        display: "block",
                                        marginTop: "6px",
                                        fontSize: "13px"
                                    }}>
                                        Ce champ est obligatoire
                                    </small>
                                )}
                            </div>

                            {/* Info Box */}
                            <div style={{
                                padding: "14px 16px",
                                background: "#f9fafb",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                                marginBottom: "24px"
                            }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    color: "#6b7280",
                                    lineHeight: "1.6"
                                }}>
                                    <strong style={{ color: "#374151" }}>Précommande #{selectedForValidation.plan_id}</strong>
                                    <br />
                                    Cette action marquera la précommande comme validée.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="button-group" style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent: "flex-end"
                            }}>
                                <button
                                    onClick={() => {
                                        setShowValidationModal(false);
                                        setValidationImage(null);
                                        setValidationDescription("");
                                        setSelectedForValidation(null);
                                    }}
                                    style={{
                                        padding: "10px 20px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        border: "1px solid #d1d5db",
                                        background: "white",
                                        color: "#374151",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = "#f9fafb";
                                        e.target.style.borderColor = "#9ca3af";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = "white";
                                        e.target.style.borderColor = "#d1d5db";
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log("🔴 BOUTON CLIQUÉ !");
                                        console.log("Description:", validationDescription);
                                        console.log("isValidating:", isValidating);
                                        handleUpdate();
                                    }}
                                    disabled={!validationDescription.trim() || isValidating}
                                    style={{
                                        padding: "10px 24px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        border: "none",
                                        background: (!validationDescription.trim() || isValidating) ? "#e5e7eb" : "#111827",
                                        color: "white",
                                        borderRadius: "6px",
                                        cursor: (!validationDescription.trim() || isValidating) ? "not-allowed" : "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => {
                                        if (validationDescription.trim() && !isValidating) {
                                            e.target.style.background = "#1f2937";
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (validationDescription.trim() && !isValidating) {
                                            e.target.style.background = "#111827";
                                        }
                                    }}
                                >
                                    {isValidating ? "Validation en cours..." : "Valider"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

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
                            maxWidth: "700px",
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
                        {/* Header */}
                        <div style={{
                            padding: "24px 32px",
                            borderBottom: "1px solid #e5e7eb",
                            background: "#ffffff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h2 style={{ margin: 0, color: "#1f2937", fontSize: "20px", fontWeight: "600" }}>
                                📋 Détails Bon de Précommande
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

                        {/* Content */}
                        <div style={{
                            padding: "32px",
                            overflowY: "auto",
                            flex: 1
                        }}>
                            {/* Section 1: Informations principales */}
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

                                <div>
                                    <label style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "6px"
                                    }}>
                                        Statut
                                    </label>
                                    <span
                                        className={`badge ${getStatusBadge(selected.etatp_name)}`}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}
                                    >
                                        <span>{getStatusIcon(selected.etatp_name)}</span>
                                        <span>{getStatusText(selected.etatp_name)}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Section 2: Montants */}
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
                                        {selected.bon_dlprixunitaire?.toLocaleString('fr-FR') || "0"} Ar
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
                                        {selected.bon_dlqte || 0}
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
                                        {selected.bon_dlprixunitaire*selected.bon_dlqte?.toLocaleString('fr-FR') || "0"} Ar
                                    </p>
                                </div>
                            </div>

                            {/* Section 3: Informations du bon */}
                            <div style={{
                                marginBottom: "24px",
                                padding: "16px",
                                background: "#eff6ff",
                                borderRadius: "8px",
                                border: "1px solid #dbeafe"
                            }}>
                                <h3 style={{
                                    margin: "0 0 16px 0",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    color: "#1e40af"
                                }}>
                                    📄 Informations du Bon
                                </h3>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "16px"
                                }}>
                                    <div>
                                        <label style={{
                                            display: "block",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                            color: "#6b7280",
                                            marginBottom: "4px"
                                        }}>
                                            Référence AR
                                        </label>
                                        <p style={{
                                            margin: 0,
                                            fontSize: "14px",
                                            color: "#111827",
                                            fontWeight: "500"
                                        }}>
                                            {selected.bon_arref || "N/A"}
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: "block",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                            color: "#6b7280",
                                            marginBottom: "4px"
                                        }}>
                                            Référence DO
                                        </label>
                                        <p style={{
                                            margin: 0,
                                            fontSize: "14px",
                                            color: "#111827",
                                            fontWeight: "500"
                                        }}>
                                            {selected.bon_doref || "N/A"}
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: "block",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                            color: "#6b7280",
                                            marginBottom: "4px"
                                        }}>
                                            Désignation
                                        </label>
                                        <p style={{
                                            margin: 0,
                                            fontSize: "14px",
                                            color: "#111827",
                                            fontWeight: "500"
                                        }}>
                                            {selected.bon_dldesign || "N/A"}
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: "block",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                            color: "#6b7280",
                                            marginBottom: "4px"
                                        }}>
                                            Date de création
                                        </label>
                                        <p style={{
                                            margin: 0,
                                            fontSize: "14px",
                                            color: "#111827",
                                            fontWeight: "500"
                                        }}>
                                            {selected.bon_cbcreation ? new Date(selected.bon_cbcreation).toLocaleDateString('fr-FR') : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Budget */}
                            {selected.budget_code && (
                                <div style={{
                                    marginBottom: "24px",
                                    padding: "16px",
                                    background: "#f0fdf4",
                                    borderRadius: "8px",
                                    border: "1px solid #bbf7d0"
                                }}>
                                    <h3 style={{
                                        margin: "0 0 16px 0",
                                        fontSize: "15px",
                                        fontWeight: "600",
                                        color: "#15803d"
                                    }}>
                                        💰 Informations Budget
                                    </h3>
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "16px"
                                    }}>
                                        <div>
                                            <label style={{
                                                display: "block",
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#6b7280",
                                                marginBottom: "4px"
                                            }}>
                                                Code Budget
                                            </label>
                                            <p style={{
                                                margin: 0,
                                                fontSize: "14px",
                                                color: "#111827",
                                                fontWeight: "500"
                                            }}>
                                                {selected.budget_code}
                                            </p>
                                        </div>

                                        <div>
                                            <label style={{
                                                display: "block",
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#6b7280",
                                                marginBottom: "4px"
                                            }}>
                                                Montant Budget
                                            </label>
                                            <p style={{
                                                margin: 0,
                                                fontSize: "14px",
                                                color: "#111827",
                                                fontWeight: "500"
                                            }}>
                                                {selected.budget_montant?.toLocaleString('fr-FR') || "0"} Ar
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section 5: Utilisateur */}
                            {selected.user_name && (
                                <div style={{
                                    marginBottom: "24px",
                                    padding: "16px",
                                    background: "#fef3c7",
                                    borderRadius: "8px",
                                    border: "1px solid #fde68a"
                                }}>
                                    <h3 style={{
                                        margin: "0 0 16px 0",
                                        fontSize: "15px",
                                        fontWeight: "600",
                                        color: "#92400e"
                                    }}>
                                        👤 Utilisateur
                                    </h3>
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "16px"
                                    }}>
                                        <div>
                                            <label style={{
                                                display: "block",
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#6b7280",
                                                marginBottom: "4px"
                                            }}>
                                                Nom
                                            </label>
                                            <p style={{
                                                margin: 0,
                                                fontSize: "14px",
                                                color: "#111827",
                                                fontWeight: "500"
                                            }}>
                                                {selected.user_name}
                                            </p>
                                        </div>

                                        <div>
                                            <label style={{
                                                display: "block",
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#6b7280",
                                                marginBottom: "4px"
                                            }}>
                                                Département
                                            </label>
                                            <p style={{
                                                margin: 0,
                                                fontSize: "14px",
                                                color: "#111827",
                                                fontWeight: "500"
                                            }}>
                                                {selected.dept_name || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section 6: Description */}
                            {selected.plan_description && (
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "8px"
                                    }}>
                                        📝 Description
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

                        {/* Footer */}
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

export default ListeBonPrecommande;

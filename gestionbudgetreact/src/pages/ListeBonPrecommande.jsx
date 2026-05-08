import { useState, useEffect } from "react";
import { ListBonprecommandeavalider, ValidationBonprecommande, EnvoiMail, getUser } from "../services/api";
import ConfirmationModal from "../components/ConfirmationModal";

function ListeBonPrecommande() {
    const [Bonprecommande, setBonPrecommande] = useState([]);
    const [message, setMessage] = useState("");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [utilisateur, setUtilisateur] = useState(null);
    const [validatingIds, setValidatingIds] = useState(new Set());

    // États pour le modal de validation
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationImage, setValidationImage] = useState(null);
    const [validationDescription, setValidationDescription] = useState("");
    const [selectedForValidation, setSelectedForValidation] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    // États pour le modal de détail réalisation
    const [showRealisationDetailModal, setShowRealisationDetailModal] = useState(false);
    const [selectedRealisation, setSelectedRealisation] = useState(null);

    // States pour la confirmation
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await ListBonprecommandeavalider();
                setBonPrecommande(data);
                const dataUtilisateur = await getUser();
                setUtilisateur(dataUtilisateur);

                // 🔍 DEBUG COMPLET : Afficher la structure exacte
                console.log("=== Bon Precommande REÇUES ===");
                console.log("Nombre total:", data.length);
                data.forEach((p, index) => {
                    console.log(`[${index}]`, p);
                    console.log(`   Clés disponibles:`, Object.keys(p));
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

    // 📋 Ouvrir le modal de détail réalisation
    const openRealisationDetailModal = (bon) => {
        setSelectedRealisation(bon);
        setShowRealisationDetailModal(true);
    };

    const closeRealisationDetailModal = () => {
        setShowRealisationDetailModal(false);
        setSelectedRealisation(null);
    };

    // Fonction de validation finale
    const handleUpdate = async () => {
        console.log("=== DÉBUT handleUpdate ===");
        console.log("selectedForValidation:", selectedForValidation);
        console.log("validationDescription:", validationDescription);
        console.log("validationImage:", validationImage);

        try {
            // CORRECTION: Utiliser plan_id car V_BonPrecommandes retourne plan_id, pas bon_id
            if (!selectedForValidation || !selectedForValidation.plan_id) {
                console.error("❌ Aucune précommande sélectionnée");
                setMessage("Erreur: Aucune précommande sélectionnée");
                return;
            }

            console.log("✅ Validations OK, début de l'envoi");
            setIsValidating(true);
            
            // Ajouter à la liste des IDs en cours de validation (grisement)
            setValidatingIds(prev => new Set(prev).add(selectedForValidation.bon_id));

            // Utiliser TOUJOURS FormData (même sans image)
            const formData = new FormData();
            // Utiliser les noms de champs du bon précommande (bon_dl*)
            formData.append('bon_dlprixunitaire', selectedForValidation.plan_prixunitaire);
            formData.append('bon_dlqte', selectedForValidation.plan_nombredemande);
            formData.append('bon_dlmontant', selectedForValidation.plan_montanttotal);
            formData.append('real_description', validationDescription);
            
            if (validationImage) {
                formData.append('real_image', validationImage);
                console.log("📤 Avec image:", validationImage.name);
            }

            console.log("📤 FormData envoyé:");
            for (const [k, v] of formData.entries()) {
                console.log("   -", k, "=>", v instanceof File ? v.name : v);
            }

            console.log("📤 appel API avec plan_id:", selectedForValidation.bon_id);

            const updated = await ValidationBonprecommande
            (
                selectedForValidation.bon_id,
                formData
            );

            console.log("✅ Réponse de l'API:", updated);

            // Envoyer l'email de confirmation
            try {
                await EnvoiMail(
                    "realisation_budget",
                    "akjeachan@gmail.com",
                    {
                        userName: utilisateur?.user_name || "Utilisateur",
                        departement: utilisateur?.dept_name || "Non spécifié",
                        date: new Date().toLocaleDateString('fr-FR'),
                        produit: selectedForValidation.prod_name || "Produit",
                        montant: selectedForValidation.plan_montanttotal?.toLocaleString('fr-FR') || "0",
                        description: validationDescription
                    }
                );
                console.log("✅ Email envoyé avec succès");
            } catch (mailError) {
                console.warn("⚠️ Erreur lors de l'envoi de l'email:", mailError);
            }

            setMessage("✅ Réalisation ajoutée avec succès et email envoyé");

            // Mettre à jour la liste
            setBonPrecommande((prev) =>
                prev.map((p) => (p && p.plan_id === updated.plan_id ? updated : p))
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
            // Retirer de la liste des IDs en cours de validation
            if (selectedForValidation?.bon_id) {
                setValidatingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(selectedForValidation.bon_id);
                    return newSet;
                });
            }
            console.log("=== FIN handleUpdate ===");
        }
    };

    // ✅ FILTRE - Affiche TOUS les bons reçus (l'API filtre déjà les "à valider")
    const filteredBonprecommande = Bonprecommande.filter(p => {
        // Afficher tous les bons reçus car:
        // - L'API ListBonprecommandeavalider filtre déjà les "non validés"
        // - On affiche aussi ceux avec réalisation (pour modification)
        return p != null;
    });

    return (
        <div style={{ padding: "40px" }}>
            <h1>Liste des Bon de Precommande</h1>
            {message && <p className="message message-info">{message}</p>}

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
                        {filteredBonprecommande.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-cell">
                                    Aucun Bon de Précommande à traiter
                                </td>
                            </tr>
                        ) : (
                            filteredBonprecommande.filter(p => p != null).map((p, index) => (
                                <tr
                                    key={`${p.plan_id}-${index}`}
                                    onClick={() => openDetailModal(p)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>{p.plan_id}</td>
                                    <td>{p.prod_name}</td>
                                    <td>{p.bon_dlprixunitaire?.toLocaleString('fr-FR')} Ar</td>
                                    <td>{p.bon_dlqte}</td>
                                    <td>{(p.bon_dlprixunitaire * p.bon_dlqte)?.toLocaleString('fr-FR')} Ar</td>
                                    <td className="text-center">
                                        {p.real_id > 0 ? (
                                            <span
                                                className="badge badge-success"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "6px 12px",
                                                    backgroundColor: "#10b981",
                                                    color: "white",
                                                    borderRadius: "4px",
                                                    fontSize: "14px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                ✅ Validé
                                            </span>
                                        ) : (
                                            <span
                                                className="badge badge-warning"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "6px 12px",
                                                    backgroundColor: "#f59e0b",
                                                    color: "white",
                                                    borderRadius: "4px",
                                                    fontSize: "14px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                ⏳ À valider
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="table-actions">
                                            {p.real_id > 0 ? (
                                                /* Réalisation existe déjà - bouton "Détail" */
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => openRealisationDetailModal(p)}
                                                    style={{
                                                        backgroundColor: "#3b82f6",
                                                        opacity: validatingIds.has(p.bon_id) ? 0.5 : 1,
                                                        cursor: validatingIds.has(p.bon_id) ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    📋 Détail
                                                </button>
                                            ) : (
                                                /* Aucune réalisation - bouton "Ajouter" */
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => openValidationModal(p)}
                                                    disabled={validatingIds.has(p.bon_id)}
                                                    style={{
                                                        opacity: validatingIds.has(p.bon_id) ? 0.5 : 1,
                                                        cursor: validatingIds.has(p.bon_id) ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {validatingIds.has(p.bon_id) ? "⏳ Ajout..." : "Ajouter"}
                                                </button>
                                            )}
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
                                Ajout de Réalisation
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
                                    Description
                                </label>
                                <textarea
                                    value={validationDescription}
                                    onChange={(e) => {
                                        console.log("📝 Description changée:", e.target.value);
                                        console.log("📝 Longueur:", e.target.value.length);
                                        setValidationDescription(e.target.value);
                                    }}
                                    rows={5}
                                    placeholder="(Optionnel) Ajoutez une note concernant cette réalisation..."
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
                                <small style={{
                                    color: "#9ca3af",
                                    display: "block",
                                    marginTop: "6px",
                                    fontSize: "13px"
                                }}>
                                    Ce champ est optionnel
                                </small>
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
                                    <strong style={{ color: "#374151" }}>Bon de Précommande #{selectedForValidation.plan_id}</strong>
                                    <br />
                                    Cette action créera automatiquement une réalisation et marquera le bon comme validé. L'image est optionnelle au départ.
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
                                        setConfirmAction(() => handleUpdate);
                                        setShowConfirmation(true);
                                    }}
                                    disabled={isValidating}
                                    style={{
                                        padding: "10px 24px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        border: "none",
                                        background: isValidating ? "#e5e7eb" : "#111827",
                                        color: "white",
                                        borderRadius: "6px",
                                        cursor: isValidating ? "not-allowed" : "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isValidating) {
                                            e.target.style.background = "#1f2937";
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isValidating) {
                                            e.target.style.background = "#111827";
                                        }
                                    }}
                                >
                                    {isValidating ? "Ajout en cours..." : "Ajouter"}
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
                                        className="badge badge-warning"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            backgroundColor: "#f59e0b",
                                            color: "white",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        ⏳ À valider
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
                                <div style={{ marginBottom: "24px" }}>
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

                            {/* Section 7: Image de validation */}
                            {selected.real_image && selected.real_image.trim() !== "" && (
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        color: "#6b7280",
                                        marginBottom: "12px"
                                    }}>
                                        🖼️ Image - Precommande validée
                                    </label>
                                    <div style={{
                                        padding: "16px",
                                        background: "#f9fafb",
                                        borderRadius: "8px",
                                        border: "1px solid #e5e7eb",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        minHeight: "300px"
                                    }}>
                                        <img
                                            src={selected.real_image.startsWith('http') ? selected.real_image : `http://localhost:5179${selected.real_image}`}
                                            alt="Justificatif de validation"
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/400x300?text=Image+introuvable";
                                            }}
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "400px",
                                                width: "auto",
                                                height: "auto",
                                                objectFit: "contain",
                                                borderRadius: "6px"
                                            }}
                                        />
                                    </div>
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

            {/* Modal de Confirmation */}
            <ConfirmationModal
                isOpen={showConfirmation}
                title="Confirmation d'Ajout de Réalisation"
                message="Voulez-vous vraiment ajouter cette réalisation ?"
                onConfirm={() => {
                    if (confirmAction) {
                        confirmAction();
                    }
                    setShowConfirmation(false);
                    setConfirmAction(null);
                }}
                onCancel={() => {
                    setShowConfirmation(false);
                    setConfirmAction(null);
                }}
                isLoading={isValidating}
            />

            {/* Modal de Détail Réalisation */}
            {showRealisationDetailModal && selectedRealisation && (
                <>
                    <div className="modal-overlay" onClick={closeRealisationDetailModal}></div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Détail de la Réalisation</h2>
                            <button
                                className="btn-close"
                                onClick={closeRealisationDetailModal}
                                aria-label="Fermer le modal"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <h3>Informations Générales</h3>
                                <div className="detail-row">
                                    <label>ID Réalisation:</label>
                                    <span>{selectedRealisation.real_id || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Bon Précommande ID:</label>
                                    <span>{selectedRealisation.bon_id || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Référence Bon:</label>
                                    <span>{selectedRealisation.bon_arref || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Produit:</label>
                                    <span>{selectedRealisation.prod_name || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Détails de Commande</h3>
                                <div className="detail-row">
                                    <label>Description:</label>
                                    <span>{selectedRealisation.plan_description || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Désignation Bon:</label>
                                    <span>{selectedRealisation.bon_dldesign || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Quantité Demandée:</label>
                                    <span>{selectedRealisation.plan_nombredemande || 0}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Quantité Bon:</label>
                                    <span>{selectedRealisation.bon_dlqte || 0}</span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Montants et Prix</h3>
                                <div className="detail-row">
                                    <label>Prix Unitaire Planifié:</label>
                                    <span>{selectedRealisation.plan_prixunitaire?.toFixed(2) || '0.00'} €</span>
                                </div>
                                <div className="detail-row">
                                    <label>Prix Unitaire Reçu:</label>
                                    <span>{selectedRealisation.real_prixunitaire?.toFixed(2) || selectedRealisation.bon_dlprixunitaire?.toFixed(2) || '0.00'} €</span>
                                </div>
                                <div className="detail-row">
                                    <label>Montant Planifié (Total):</label>
                                    <span>{selectedRealisation.plan_montanttotal?.toFixed(2) || '0.00'} €</span>
                                </div>
                                <div className="detail-row">
                                    <label>Montant TTC Bon:</label>
                                    <span className="amount-highlight">{selectedRealisation.bon_dlmontantttc?.toFixed(2) || '0.00'} €</span>
                                </div>
                                <div className="detail-row">
                                    <label>Montant Réalisé:</label>
                                    <span className="amount-highlight">{selectedRealisation.real_montantreel?.toFixed(2) || '0.00'} €</span>
                                </div>
                                <div className="detail-row">
                                    <label>Budget Alloué:</label>
                                    <span>{selectedRealisation.budget_montant?.toFixed(2) || '0.00'} €</span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Informations Spécifiques</h3>
                                <div className="detail-row">
                                    <label>Département:</label>
                                    <span>{selectedRealisation.dept_name || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Budget Code:</label>
                                    <span>{selectedRealisation.budget_code || 'N/A'}</span>
                                </div>
                            </div>

                            {selectedRealisation.real_image && (
                                <div className="detail-section">
                                    <h3>Image</h3>
                                    <div className="image-container">
                                        <img
                                            src={`/uploads/${selectedRealisation.real_image}`}
                                            alt="Réalisation"
                                            style={{ maxWidth: '100%', maxHeight: '300px', marginTop: '10px' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="detail-section">
                                <h3>Dates</h3>
                                <div className="detail-row">
                                    <label>Date Création Planification:</label>
                                    <span>{selectedRealisation.plan_datecreation ? new Date(selectedRealisation.plan_datecreation).toLocaleDateString('fr-FR') : 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Date Création Bon:</label>
                                    <span>{selectedRealisation.bon_cbcreation ? new Date(selectedRealisation.bon_cbcreation).toLocaleDateString('fr-FR') : 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Date Budget:</label>
                                    <span>{selectedRealisation.budget_datecreation ? new Date(selectedRealisation.budget_datecreation).toLocaleDateString('fr-FR') : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={closeRealisationDetailModal}
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

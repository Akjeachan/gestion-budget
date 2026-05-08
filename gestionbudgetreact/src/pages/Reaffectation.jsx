import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AjoutReaffectation, getBudget, ListePlannification } from "../services/api";

function Reaffectation() {
    const [budget1, setBudget1] = useState("");
    const [budget2, setBudget2] = useState("");
    const [montantreaffectation, setMontantReaffectation] = useState("");
    const [description, setDescription] = useState("");
    const [budgetdispo, setBudgetDispo] = useState([]);
    const [allPlannifications, setAllPlannifications] = useState([]);
    const [hoveredBudget, setHoveredBudget] = useState(null);
    const [modalData, setModalData] = useState([]);
    const [loadingModal, setLoadingModal] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Obtenir le montant disponible du budget source
    const budgetSourceData = budgetdispo.find(b => b.budget_id === parseInt(budget1));
    const budgetSourceMontant = budgetSourceData ? parseFloat(budgetSourceData.budget_montant || 0) : 0;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const budgetData = await getBudget();
                setBudgetDispo(budgetData);
                
                const plannifData = await ListePlannification();
                setAllPlannifications(plannifData || []);
            } catch (error) {
                setMessage("Erreur lors du chargement des budgets : " + error.message);
            }
        };
        fetchData();
    }, []);

    const handleBudgetHover = async (budgetId, event) => {
        if (!budgetId) return;
        
        setMousePos({ x: event.clientX, y: event.clientY });
        setHoveredBudget(budgetId);
        setLoadingModal(true);
        
        try {
            // Filtrer les planifications par budget_id (vérifier plusieurs champs possibles)
            const filtered = allPlannifications.filter(plan => 
                String(plan.budget_id) === String(budgetId) ||
                String(plan.budget_plannificationid) === String(budgetId) ||
                (plan.budget && String(plan.budget.budget_id) === String(budgetId))
            );
            
            // Logging pour debug
            console.log("Budget sélectionné:", budgetId);
            console.log("Nombre de planifications trouvées:", filtered.length);
            console.log("Planifications filtrées:", filtered);
            
            setModalData(filtered || []);
        } catch (error) {
            console.error("Erreur dans handleBudgetHover:", error);
            setModalData([]);
        } finally {
            setLoadingModal(false);
        }
    };

    const handleBudgetLeave = () => {
        setHoveredBudget(null);
        setModalData([]);
    };

    const handlereaffectation = async () => {
        try {
            // Validation des champs
            if (!budget1 || !budget2 || !montantreaffectation || !description) {
                setMessage("Veuillez remplir tous les champs correctement.");
                return;
            }

            if (budget1 === budget2) {
                setMessage("Les deux budgets doivent être différents.");
                return;
            }

            const montant = parseFloat(montantreaffectation);
            if (isNaN(montant) || montant <= 0) {
                setMessage("Le montant doit être un nombre positif.");
                return;
            }

            // ✅ NOUVELLE VALIDATION: Montant ne doit pas dépasser le budget source
            if (montant > budgetSourceMontant) {
                setMessage(`❌ Montant invalide. Le montant à réaffecter (${montant.toLocaleString('fr-FR')} Ar) ne peut pas dépasser le budget source (${budgetSourceMontant.toLocaleString('fr-FR')} Ar).`);
                return;
            }

            setLoading(true);

            const data = await AjoutReaffectation(
                parseInt(budget1),
                parseInt(budget2),
                montant,
                description.trim()
            );

            setMessage("✅ Réaffectation réussie : " + JSON.stringify(data));
            navigate("/reaffectation");
        } catch (error) {
            setMessage("❌ Erreur lors de la réaffectation : " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>
                    📤 Réaffectation de Budget
                </h1>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                    Transférez des montants entre vos budgets de manière simple et sécurisée
                </p>
            </div>

            {message && (
                <div style={{
                    padding: "12px 16px",
                    background: message.includes("Erreur") || message.includes("invalide") || message.includes("❌") ? "#fee2e2" : "#d1fae5",
                    border: `1px solid ${message.includes("Erreur") || message.includes("invalide") || message.includes("❌") ? "#fca5a5" : "#6ee7b7"}`,
                    borderRadius: "8px",
                    color: message.includes("Erreur") || message.includes("invalide") || message.includes("❌") ? "#991b1b" : "#065f46",
                    marginBottom: "20px",
                    fontSize: "14px"
                }}>
                    {message}
                </div>
            )}

            <div style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "24px"
            }}>
                {/* Budget Source */}
                <div style={{ marginBottom: "24px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px"
                    }}>
                        Budget Source
                    </label>
                    <select 
                        value={budget1} 
                        onChange={(e) => setBudget1(e.target.value)}
                        onMouseEnter={(e) => handleBudgetHover(budget1, e)}
                        onMouseLeave={handleBudgetLeave}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            background: "white",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        <option value="">-- Sélectionnez un budget --</option>
                        {budgetdispo.map((b) => (
                            <option key={b.budget_id} value={b.budget_id}>
                                {b.budget_code} - {parseFloat(b.budget_montant || 0).toLocaleString('fr-FR')} Ar
                            </option>
                        ))}
                    </select>
                    {budget1 && budgetSourceData && (
                        <div style={{
                            marginTop: "8px",
                            padding: "12px",
                            background: "#f3f4f6",
                            borderRadius: "6px",
                            fontSize: "13px",
                            color: "#374151"
                        }}>
                            <strong>Montant disponible:</strong> {budgetSourceMontant.toLocaleString('fr-FR')} Ar
                        </div>
                    )}
                </div>

                {/* Budget Destination */}
                <div style={{ marginBottom: "24px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px"
                    }}>
                        Budget Destination
                    </label>
                    <select 
                        value={budget2} 
                        onChange={(e) => setBudget2(e.target.value)}
                        onMouseEnter={(e) => handleBudgetHover(budget2, e)}
                        onMouseLeave={handleBudgetLeave}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            background: "white",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        <option value="">-- Sélectionnez un budget --</option>
                        {budgetdispo.map((b) => (
                            <option key={b.budget_id} value={b.budget_id}>
                                {b.budget_code}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Montant à réaffecter */}
                <div style={{ marginBottom: "24px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px"
                    }}>
                        Montant à réaffecter (Ar) <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 10000.00"
                        value={montantreaffectation}
                        onChange={(e) => setMontantReaffectation(e.target.value)}
                        max={budgetSourceMontant}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontFamily: "inherit"
                        }}
                    />
                    {montantreaffectation && budgetSourceMontant > 0 && (
                        <div style={{
                            marginTop: "8px",
                            padding: "12px",
                            background: montantreaffectation > budgetSourceMontant ? "#fee2e2" : "#d1fae5",
                            border: `1px solid ${montantreaffectation > budgetSourceMontant ? "#fca5a5" : "#6ee7b7"}`,
                            borderRadius: "6px",
                            fontSize: "13px",
                            color: montantreaffectation > budgetSourceMontant ? "#991b1b" : "#065f46"
                        }}>
                            {montantreaffectation > budgetSourceMontant 
                                ? `⚠️ Montant invalide: ${parseFloat(montantreaffectation).toLocaleString('fr-FR')} > ${budgetSourceMontant.toLocaleString('fr-FR')}`
                                : `✅ Montant valide: ${parseFloat(montantreaffectation).toLocaleString('fr-FR')} Ar`
                            }
                        </div>
                    )}
                </div>

                {/* Description */}
                <div style={{ marginBottom: "24px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px"
                    }}>
                        Raison de la réaffectation <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <textarea
                        placeholder="Décrivez la raison ou les détails de cette réaffectation..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontFamily: "inherit",
                            resize: "vertical"
                        }}
                    />
                </div>

                {/* Button */}
                <div style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end"
                }}>
                    <button 
                        onClick={() => navigate("/")}
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
                        onClick={handlereaffectation} 
                        disabled={loading || !budget1 || !budget2 || !montantreaffectation || !description || parseFloat(montantreaffectation) > budgetSourceMontant}
                        style={{
                            padding: "10px 24px",
                            fontSize: "14px",
                            fontWeight: "500",
                            border: "none",
                            background: (loading || !budget1 || !budget2 || !montantreaffectation || !description || parseFloat(montantreaffectation) > budgetSourceMontant) ? "#e5e7eb" : "#667eea",
                            color: "white",
                            borderRadius: "6px",
                            cursor: (loading || !budget1 || !budget2 || !montantreaffectation || !description || parseFloat(montantreaffectation) > budgetSourceMontant) ? "not-allowed" : "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                            if (!loading && budget1 && budget2 && montantreaffectation && description && parseFloat(montantreaffectation) <= budgetSourceMontant) {
                                e.target.style.background = "#5a67d8";
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!loading && budget1 && budget2 && montantreaffectation && description && parseFloat(montantreaffectation) <= budgetSourceMontant) {
                                e.target.style.background = "#667eea";
                            }
                        }}
                    >
                        {loading ? "⏳ Traitement..." : "✅ Faire Réaffectation"}
                    </button>
                </div>
            </div>

            {/* Modal Planifications au Hover - Position Fixed */}
            {hoveredBudget && (
                <div 
                    className="budget-modal"
                    style={{
                        position: 'fixed',
                        top: `${mousePos.y + 10}px`,
                        left: `${mousePos.x + 10}px`,
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        padding: '12px',
                        maxWidth: '450px',
                        zIndex: 1000,
                        maxHeight: '350px',
                        overflowY: 'auto'
                    }}
                    onMouseLeave={handleBudgetLeave}
                >
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        Planifications du Budget
                    </h4>
                    
                    {loadingModal ? (
                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Chargement...</p>
                    ) : modalData.length > 0 ? (
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ddd' }}>
                                    <th style={{ textAlign: 'left', padding: '6px', fontWeight: 'bold', color: '#333' }}>PRODUIT</th>
                                    <th style={{ textAlign: 'left', padding: '6px', fontWeight: 'bold', color: '#333' }}>DESCRIPTION</th>
                                    <th style={{ textAlign: 'right', padding: '6px', fontWeight: 'bold', color: '#333' }}>MONTANT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalData.map((plan, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '6px', color: '#555' }}>
                                            {plan.prod_name || 'N/A'}
                                        </td>
                                        <td style={{ padding: '6px', color: '#555' }}>
                                            {plan.plan_description || plan.planDescription || plan.description || 'N/A'}
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '6px', color: '#0066cc', fontWeight: '600' }}>
                                            {parseFloat(plan.budget_montant|| 0).toLocaleString('fr-FR', { 
                                                style: 'currency', 
                                                currency: 'MGA' 
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: '#999', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>Aucune planification trouvée</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Reaffectation;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AjoutReaffectation, getBudget } from "../services/api";

function Reaffectation() {
    const [budget1, setBudget1] = useState("");
    const [budget2, setBudget2] = useState("");
    const [montantreaffectation, setMontantReaffectation] = useState("");
    const [description, setDescription] = useState("");
    const [budgetdispo, setBudgetDispo] = useState([]);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBudget = async () => {
            try {
                const data = await getBudget();
                setBudgetDispo(data);
            } catch (error) {
                setMessage("Erreur lors du chargement des budgets : " + error.message);
            }
        };
        fetchBudget();
    }, []);

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
        <div className="form-container">
            <h1>📅 Réaffectation</h1>
            <p>Réaffectation des budgets dans la planification</p>

            <div className="form-group">
                <label>Budget source</label>
                <select value={budget1} onChange={(e) => setBudget1(e.target.value)}>
                    <option value="">-- Sélectionnez un budget --</option>
                    {budgetdispo.map((b) => (
                        <option key={b.budget_id} value={b.budget_id}>
                            {b.budget_code}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Budget destination</label>
                <select value={budget2} onChange={(e) => setBudget2(e.target.value)}>
                    <option value="">-- Sélectionnez un budget --</option>
                    {budgetdispo.map((b) => (
                        <option key={b.budget_id} value={b.budget_id}>
                            {b.budget_code}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Montant à réaffecter (Ar)</label>
                <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 10000.00"
                    value={montantreaffectation}
                    onChange={(e) => setMontantReaffectation(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Description</label>
                <textarea
                    placeholder="Décrivez votre planification..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                />
            </div>

            <div className="button-group">
                <button onClick={handlereaffectation} disabled={loading}>
                    {loading ? "⏳ Traitement..." : "✅ Faire Réaffectation"}
                </button>
            </div>

            {message && <p className="message message-info">{message}</p>}
        </div>
    );
}

export default Reaffectation;
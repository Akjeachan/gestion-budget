import { useState, useEffect } from "react";
import { getComparaisonBudgets, getRealisations, getStatistiques } from "../services/api";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "../styles/Comparaison.css";

function Comparaison() {
    const [comparaison, setComparaison] = useState([]);
    const [realisations, setRealisations] = useState([]);
    const [statistiques, setStatistiques] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [comparaisonData, realisationsData, statistiquesData] = await Promise.all([
                    getComparaisonBudgets(),
                    getRealisations(),
                    getStatistiques()
                ]);

                setComparaison(comparaisonData);
                setRealisations(realisationsData);
                setStatistiques(statistiquesData);
                setMessage("");
            } catch (error) {
                setMessage(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Préparer les données pour le graphique
    const chartData = comparaison.map(item => ({
        name: item.planDescription ? item.planDescription.substring(0, 15) : "Plan",
        Planifié: item.montantPlanifie,
        Réalisé: item.montantRealise,
        Écart: item.ecart
    }));

    const formatCurrency = (value) =>
        Number(value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' });

    if (loading) {
        return <div className="comparaison-container"><p>Chargement...</p></div>;
    }

    return (
        <div className="comparaison-container">
            <h1>Comparaison Budget et Réalisations</h1>

            {message && <div className="alert alert-danger">{message}</div>}

            {/* Statistiques globales */}
            {statistiques && (
                <div className="statistiques-grid">
                    <div className="stat-card">
                        <h3>Montant Total Planifié</h3>
                        <p className="stat-value">{formatCurrency(statistiques.montantTotalPlanifie)}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Montant Total Réalisé</h3>
                        <p className="stat-value">{formatCurrency(statistiques.montantTotalRealise)}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Écart Total</h3>
                        <p className={`stat-value ${statistiques.ecartTotal >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(statistiques.ecartTotal)}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3>% de Réalisation</h3>
                        <p className="stat-value">{statistiques.pourcentageRealisation}%</p>
                    </div>
                    <div className="stat-card">
                        <h3>Montant Bon de Commande (TTC)</h3>
                        <p className="stat-value">{formatCurrency(statistiques.montantTotalBonCommandeTTC)}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Montant Facture (TTC)</h3>
                        <p className="stat-value">{formatCurrency(statistiques.montantTotalFactureTTC)}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Écart Plan vs Bon de Commande</h3>
                        <p className={`stat-value ${statistiques.ecartPlanVsBonCommande >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(statistiques.ecartPlanVsBonCommande)}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3>Écart Plan vs Facture</h3>
                        <p className={`stat-value ${statistiques.ecartPlanVsFacture >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(statistiques.ecartPlanVsFacture)}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3>% Bon de Commande</h3>
                        <p className="stat-value">{statistiques.pourcentageBonCommande}%</p>
                    </div>
                    <div className="stat-card">
                        <h3>% Facture</h3>
                        <p className="stat-value">{statistiques.pourcentageFacture}%</p>
                    </div>
                    <div className="stat-card">
                        <h3>Nombre de Bons de Commande</h3>
                        <p className="stat-value">{statistiques.nombreBonCommandes || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Nombre de Factures</h3>
                        <p className="stat-value">{statistiques.nombreFactures || 0}</p>
                    </div>
                </div>
            )}

            {/* Graphique en Area */}
            <div className="chart-container">
                <h2>Visualisation des Montants</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPlanifié" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRéalisé" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="Planifié"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorPlanifié)"
                        />
                        <Area
                            type="monotone"
                            dataKey="Réalisé"
                            stroke="#82ca9d"
                            fillOpacity={1}
                            fill="url(#colorRéalisé)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Tableaux côte à côte */}
            <div className="tables-wrapper">
                {/* Tableau Planifications */}
                <div className="table-section">
                    <h2>Planifications</h2>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Montant Planifié</th>
                                    <th>Produit</th>
                                    <th>% Réalisation</th>
                                    <th>Date Création</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparaison.length > 0 ? (
                                    comparaison.map((item) => (
                                        <tr key={item.planId}>
                                            <td>{item.planDescription}</td>
                                            <td className="amount-cell">
                                                {item.montantPlanifie.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                                            </td>
                                            <td>
                                                {item.prodName}
                                            </td>
                                            <td className="percentage-cell">
                                                {((item.montantRealise / item.montantPlanifie) * 100).toFixed(2)}%
                                            </td>
                                            <td>{new Date(item.dateCreation).toLocaleDateString('fr-FR')}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="empty-cell">Aucune planification</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tableau Réalisations */}
                <div className="table-section">
                    <h2>Réalisations</h2>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Prix Unitaire</th>
                                    <th>Montant Réel</th>
                                    <th>Écart</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {realisations.length > 0 ? (
                                    realisations.map((item) => (
                                        <tr key={item.realisationId}>
                                            <td>{item.description}</td>
                                            <td className="amount-cell">
                                                {parseFloat(item.prixUnitaire || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                                            </td>
                                            <td className="amount-cell">
                                                {parseFloat(item.montantReel || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                                            </td>
                                            <td className={`amount-cell ${item.ecart >= 0 ? 'positive' : 'negative'}`}>
                                                {item.ecart.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                                            </td>
                                            <td>{new Date(item.dateRealisation).toLocaleDateString('fr-FR')}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="empty-cell">Aucune réalisation</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Comparaison;

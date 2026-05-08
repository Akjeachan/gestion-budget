import { useState, useEffect } from "react";
import { ListProduit, updateProduit } from "../services/api";

function ListeProduit() {
    const [Produit, SetProduit] = useState([]);
    const [message, setMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await ListProduit();
                SetProduit(data);
            } catch (error) {
                setMessage(error.message);
            }
        };
        fetchData();
    }, []);

    const openModal = (Produit) => {
        setSelected({ ...Produit });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelected(null);
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'En attente':
                return 'badge-warning';
            case 'Approuvé':
                return 'badge-success';
            case 'Rejeté':
                return 'badge-danger';
            default:
                return 'badge-secondary';
        }
    };

    const handleUpdate = async () => {
        try {
            const updated = await updateProduit(selected.prod_id, selected);
            setMessage("Produit mise à jour avec succès");

            SetProduit((prev) =>
                prev.map((p) => (p.prod_id === updated.prod_id ? updated : p))
            );

            closeModal();
        } catch (error) {
            setMessage(error.message);
        }
    };


    return (
        <div style={{ padding: "40px" }}>
            <h1>Liste des Produit</h1>
            {message && <p className="message message-info">{message}</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Produit</th>
                            <th>Prix Unitaire</th>
                            <th>Nombre Demandé</th>
                            <th>Montant Total</th>
                            <th>Statut</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Produit.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-cell">
                                    Aucune Produit trouvée
                                </td>
                            </tr>
                        ) : (
                            Produit.map((p) => (
                                <tr key={p.plan_id}>
                                    <td>{p.plan_id}</td>
                                    <td>{p.prod_name}</td>
                                    <td>{p.plan_prixunitaire?.toLocaleString('fr-FR')} Ar</td>
                                    <td>{p.plan_nombredemande}</td>
                                    <td>{p.plan_montanttotal?.toLocaleString('fr-FR')} Ar</td>
                                    <td className="text-center">
                                        <span className={`badge ${getStatusBadge(p.etat?.etatp_name)}`}>
                                            {p.etat?.etatp_name || "En attente"}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="table-actions">
                                            <button 
                                                className="btn-primary" 
                                                onClick={() => openModal(p)}
                                            >
                                                Modifier
                                            </button>
                                            <button className="btn-danger">
                                                Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de modification */}
            {showModal && selected && (
                <>
                    {/* Overlay */}
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
                        onClick={closeModal}
                    />

                    {/* Modal */}
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
                        <h2>Modifier Produit</h2>

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
                            <button onClick={handleUpdate}>Enregistrer</button>
                            <button className="btn-danger" onClick={closeModal}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ListeProduit;
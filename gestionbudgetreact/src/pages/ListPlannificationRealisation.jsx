import { useState, useEffect } from "react";
import { ListPlannificationRealisation, Realisation } from "../services/api";
import { useNavigate } from "react-router-dom";

function ListePlannificationRealisation() {
  const [realisation, setRealisation] = useState([]);
  const [prixunitaire, setPrixunitaire] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ListPlannificationRealisation();
        setRealisation(data);
      } catch (error) {
        setMessage(error.message);
      }
    };
    fetchData();
  }, []);

  const openModal = (realisation) => {
    setSelected({ ...realisation });
    setPrixunitaire(realisation.plan_prixunitaire?.toString() || "");
    setDescription(realisation.plan_description || "");
    setShowModal(true);
  };

  const openDetailModal = (realisation) => {
    setSelected({ ...realisation });
    setShowDetailModal(true);
  };

  const closeModals = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setSelected(null);
    setPrixunitaire("");
    setDescription("");
    setImage(null);
    setMessage("");
  };

  const handleRealisation = async () => {
    try {
      if (!prixunitaire || !description || !image) {
        setMessage("⚠️ Veuillez remplir tous les champs correctement.");
        return;
      }

      if (!selected?.plan_id) {
        setMessage("❌ Erreur : ID de planification manquant.");
        return;
      }

      const data = await Realisation(
        parseFloat(prixunitaire),
        description,
        selected.plan_id,
        image
      );

      setMessage(
        "✅ Insertion Réalisation réussie : " +
        data.real_prixunitaire.toLocaleString("fr-FR") +
        " Ar - " +
        data.real_description
      );

      setTimeout(() => {
        navigate("/listrealisation");
      }, 1500);
    } catch (error) {
      setMessage("❌ Erreur : " + error.message);
    }
  };

  const getStatusBadge = (etatpName) => {
    if (etatpName === "validé") return "badge-success";
    if (etatpName === "non validé") return "badge-warning";
    if (etatpName === "rejeté") return "badge-danger";
    return "badge-info";
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Liste des Planifications à Réaliser</h1>
      {message && <p className="message message-info">{message}</p>}

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
            {realisation.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  Aucune planification trouvée
                </td>
              </tr>
            ) : (
              realisation.map((p) => (
                <tr
                  key={p.plan_id}
                  onClick={() => openDetailModal(p)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{p.plan_id}</td>
                  <td>{p.prod_name}</td>
                  <td>{p.plan_prixunitaire?.toLocaleString("fr-FR") || "N/A"} Ar</td>
                  <td>{p.plan_nombredemande || 0}</td>
                  <td>{p.plan_montanttotal?.toLocaleString("fr-FR") || "N/A"} Ar</td>
                  <td className="text-center">
                    <span className={`badge ${getStatusBadge(p.etatp_name)}`}>
                      {p.etatp_name || "En attente"}
                    </span>
                  </td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="table-actions">
                      <button className="btn-primary" onClick={() => openModal(p)}>
                        Réalisation
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && selected && (
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
            <h2>Créer une Réalisation</h2>

            <div className="form-group">
              <label>
                Image <span style={{ color: "red" }}>*</span>:
              </label>
              <input
                type="file"
                className="custom-file-input"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
              />
              {image && (
                <small style={{ color: "green" }}>
                  Fichier sélectionné: {image.name}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>
                Prix Unitaire <span style={{ color: "red" }}>*</span>:
              </label>
              <input
                type="number"
                step="0.01"
                value={prixunitaire}
                onChange={(e) => setPrixunitaire(e.target.value)}
                placeholder="Ex: 1500.50"
              />
            </div>

            <div className="form-group">
              <label>
                Description <span style={{ color: "red" }}>*</span>:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Décrivez la réalisation..."
              />
            </div>

            <div className="button-group">
              <button className="btn-primary" onClick={handleRealisation}>
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
              maxWidth: "900px",
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
                Détails de la Planification #{selected.plan_id}
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
                  <span className={`badge ${getStatusBadge(selected.etatp_name)}`}>
                    {selected.etatp_name || "En attente"}
                  </span>
                </div>
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
                <div style={{ marginBottom: "24px" }}>
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

              {selected.plan_facture && (
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#6b7280",
                    marginBottom: "12px"
                  }}>
                    Facture / Document
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
                      src={`http://localhost:5179${selected.plan_facture}`}
                      alt="Facture"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300?text=Image+introuvable";
                      }}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "400px",
                        height: "auto",
                        borderRadius: "6px"
                      }}
                    />
                  </div>
                </div>
              )}

              {selected.plan_datecreation && (
                <div style={{
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e5e7eb"
                }}>
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
                    color: "#374151"
                  }}>
                    {new Date(selected.plan_datecreation).toLocaleDateString('fr-FR')}
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

export default ListePlannificationRealisation;
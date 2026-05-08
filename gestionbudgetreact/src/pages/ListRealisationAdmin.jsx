import { useState, useEffect } from "react";
import { ValidationRealisation, ListRealisationencours, ListToutRealisation, EnvoiMail, getUser } from "../services/api";
import ConfirmationModal from "../components/ConfirmationModal";

function ListeRealisationAdmin() {
  const [realisation, setRealisation] = useState([]);
  const [toutrealisation, setToutRealisation] = useState([]);
  const [message, setMessage] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("tous");
  const [utilisateur, setUtilisateur] = useState(null);
  const [validatingIds, setValidatingIds] = useState(new Set());

  // States pour la confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ListRealisationencours();
        setRealisation(data);
        const dataall = await ListToutRealisation();
        setToutRealisation(dataall);
        const dataUtilisateur = await getUser();
        setUtilisateur(dataUtilisateur);
      } catch (error) {
        setMessage(error.message);
      }
    };
    fetchData();
  }, []);

  const openDetailModal = (realisation) => {
    setSelected({ ...realisation });
    setShowDetailModal(true);
  };

  const closeModals = () => {
    setShowDetailModal(false);
    setSelected(null);
  };

  const handleRealisation = async (e, realisationId) => {
    e.stopPropagation();
    
    setConfirmAction(() => async () => {
      try {
        // Ajouter à la liste des IDs en cours de validation (grisement)
        setValidatingIds(prev => new Set(prev).add(realisationId));
        
        // Récupérer les détails de la réalisation pour l'email
        const realisationDetails = realisation.find(r => r.real_id === realisationId) || 
                                    toutrealisation.find(r => r.real_id === realisationId);
        
        await ValidationRealisation(realisationId);
        
        // Envoyer l'email de confirmation
        try {
          await EnvoiMail(
            "realisation_budget_valider",
            "akjeachan@gmail.com",
            {
              userName: utilisateur?.user_name || "Utilisateur",
              departement: utilisateur?.dept_name || "Non spécifié",
              date: new Date().toLocaleDateString('fr-FR'),
              produit: realisationDetails?.prod_name || "Produit",
              montant: realisationDetails?.real_montantreel?.toLocaleString('fr-FR') || "0",
              montantPlan: realisationDetails?.plan_montanttotal?.toLocaleString('fr-FR') || "0"
            }
          );
          console.log("✅ Email envoyé avec succès");
        } catch (mailError) {
          console.warn("⚠️ Erreur lors de l'envoi de l'email:", mailError);
        }
        
        setMessage("✅ Validation Réalisation réussie et email envoyé !");
        
        // Mettre à jour la liste des réalisations en cours
        setRealisation((prev) =>
          prev.filter((r) => r.real_id !== realisationId)
        );
        
        // Mettre à jour la liste complète
        setToutRealisation((prev) =>
          prev.map((r) =>
            r.real_id === realisationId
              ? { ...r, etat_namerealisation: "validé", etat_name: "validé", etatp_name: "validé" }
              : r
          )
        );
        
        // Fermer la modal si elle affiche la réalisation validée
        if (selected && selected.real_id === realisationId) {
          closeModals();
        }
      } catch (error) {
        setMessage("❌ Erreur : " + (error.response?.data?.message || error.message));
      } finally {
        // Retirer de la liste des IDs en cours de validation
        setValidatingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(realisationId);
          return newSet;
        });
      }
    });
    
    setShowConfirmation(true);
  };

  const getStatusBadge = (etatpName) => {
    const normalized = normalizeStatus(etatpName);
    if (normalized === "valide") return "badge-success";
    if (normalized === "non valide" || normalized === "en attente" || normalized === "a valider" || normalized === "a valide" || normalized === "non realiser" || normalized === "non realise") return "badge-warning";
    if (normalized === "rejete") return "badge-danger";
    return "badge-info";
  };

  const normalizeStatus = (status) => {
    if (!status) return "";
    return status
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const getEtatName = (item) => {
    return item?.etat_namerealisation || item?.etat_name || item?.etatp_name || item?.etat?.etatp_name || "";
  };

  const getStatusText = (etatName) => {
    if (!etatName) return "En attente";
    const normalized = normalizeStatus(etatName);

    if (normalized === "valide") return "Validé";
    if (normalized === "non valide") return "Non validé";
    if (normalized === "non realiser" || normalized === "non realise") return "En attente";
    if (normalized === "rejete") return "Rejeté";
    if (normalized === "en attente") return "En attente";
    if (normalized === "a valider" || normalized === "a valide") return "À valider";

    return etatName;
  };

  const canValidateStatus = (etatName) => {
    const normalized = normalizeStatus(etatName);
    return (
      normalized === "non valide" ||
      normalized === "en attente" ||
      normalized === "a valider" ||
      normalized === "a valide"
    );
  };

  const filteredRealisation = toutrealisation.filter(r => {
    if (filterStatus === "tous") return true;
    const statusNormalized = normalizeStatus(getEtatName(r));
    const filterNormalized = normalizeStatus(filterStatus);
    return statusNormalized === filterNormalized;
  });

  const maxMontant = filteredRealisation.length > 0 
    ? Math.max(...filteredRealisation.map(r => r.real_montantreel || 0))
    : 0;

  return (
    <div style={{ padding: "40px" }}>
      <h1>Liste des Réalisations (Admin)</h1>
      {message && <p className="message message-info">{message}</p>}

      {toutrealisation.length > 0 && (
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
              Graphique des Montants Réels
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
          
          {filteredRealisation.length === 0 ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "14px"
            }}>
              Aucune réalisation avec le statut "{filterStatus}"
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
                        title={`${r.prod_name}: ${r.real_montantreel?.toLocaleString('fr-FR')} Ar`}
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
                          {(r.real_montantreel / 1000).toFixed(0)}k
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
                        {r.prod_name}
                      </div>

                      <div style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "#f3f4f6",
                        color: "#6b7280",
                        fontWeight: "500"
                      }}>
                        {getStatusText(getEtatName(r))}
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
                  <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>Nombre</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                    {filteredRealisation.length}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>Total Réalisé</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                    {filteredRealisation.reduce((sum, r) => sum + (r.real_montantreel || 0), 0).toLocaleString('fr-FR')} Ar
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>Moyenne</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                    {filteredRealisation.length > 0 
                      ? Math.round(filteredRealisation.reduce((sum, r) => sum + (r.real_montantreel || 0), 0) / filteredRealisation.length).toLocaleString('fr-FR')
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
              <th>Produit</th>
              <th>Montant Total Realisation</th>
              <th>Prix Unitaire Realisation</th>
              <th>Prix Unitaire Plannification</th>
              <th>Quantité</th>
              <th>Montant Total Plannification</th>
              <th>Montant Budget</th>
              <th>Code Budget</th>
              <th className="text-center">Statut</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {realisation.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-cell">
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
                  <td>{r.real_montantreel?.toLocaleString("fr-FR") || "0"} Ar</td>
                  <td>{r.real_prixunitaire?.toLocaleString("fr-FR") || "0"} Ar</td>
                  <td>{r.plan_prixunitaire?.toLocaleString("fr-FR") || "0"} Ar</td>
                  <td>{r.plan_nombredemande || 0}</td>
                  <td>{r.plan_montanttotal?.toLocaleString("fr-FR") || "0"} Ar</td>
                  <td>{r.budget_montant?.toLocaleString("fr-FR") || "0"} Ar</td>
                  <td>{r.budget_code || "N/A"}</td>
                  <td className="text-center">
                    <span className={`badge ${getStatusBadge(getEtatName(r))}`}>
                      {getStatusText(getEtatName(r))}
                    </span>
                  </td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="table-actions">
                      {canValidateStatus(getEtatName(r)) ? (
                        <button 
                          className="btn-primary" 
                          onClick={(e) => handleRealisation(e, r.real_id)}
                          disabled={validatingIds.has(r.real_id)}
                          style={{
                            opacity: validatingIds.has(r.real_id) ? 0.5 : 1,
                            cursor: validatingIds.has(r.real_id) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {validatingIds.has(r.real_id) ? "⏳ Validation..." : "Valider"}
                        </button>
                      ) : (
                        <button className="btn-primary" onClick={() => openDetailModal(r)}>
                          Détails
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
            <div style={{
              padding: "24px 32px",
              borderBottom: "1px solid #e5e7eb",
              background: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ margin: 0, color: "#1f2937", fontSize: "20px", fontWeight: "600" }}>
                Détails Réalisation #{selected.real_id}
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
                  <span className={`badge ${getStatusBadge(getEtatName(selected))}`}>
                    {getStatusText(getEtatName(selected))}
                  </span>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
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
                    Prix Unitaire Réalisation
                  </label>
                  <p style={{ 
                    margin: 0,
                    fontSize: "18px",
                    color: "#111827",
                    fontWeight: "600"
                  }}>
                    {selected.real_prixunitaire?.toLocaleString('fr-FR') || "0"} Ar
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
                    Prix Unitaire Plannification
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
                    Montant Total Réalisation
                  </label>
                  <p style={{ 
                    margin: 0,
                    fontSize: "18px",
                    color: "#111827",
                    fontWeight: "600"
                  }}>
                    {selected.real_montantreel?.toLocaleString('fr-FR') || "0"} Ar
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
                    Montant Budget
                  </label>
                  <p style={{ 
                    margin: 0,
                    fontSize: "18px",
                    color: "#111827",
                    fontWeight: "600"
                  }}>
                    {selected.budget_montant?.toLocaleString('fr-FR') || "0"} Ar
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
                    Code Budget
                  </label>
                  <p style={{ 
                    margin: 0,
                    fontSize: "18px",
                    color: "#111827",
                    fontWeight: "600"
                  }}>
                    {selected.budget_code || "N/A"}
                  </p>
                </div>
              </div>

              {selected.real_description && (
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
                    {selected.real_description}
                  </p>
                </div>
              )}

              {selected.real_image && selected.real_image.trim() !== "" && (
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#6b7280",
                    marginBottom: "12px"
                  }}>
                    Image
                  </label>
                  <div style={{
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px"
                  }}>
                    <img 
                      src={selected.real_image.startsWith('http') ? selected.real_image : `http://localhost:5179${selected.real_image}`} 
                      alt="Réalisation"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300?text=Image+introuvable";
                      }}
                      style={{ 
                        maxWidth: "100%",
                        maxHeight: "500px",
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
        title="Confirmation de Validation"
        message="Voulez-vous vraiment valider ?"
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
        isLoading={validatingIds.size > 0}
      />
    </div>
  );
}

export default ListeRealisationAdmin;
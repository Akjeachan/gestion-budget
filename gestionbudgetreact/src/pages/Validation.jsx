import { useState, useEffect } from "react";
import { ListeValidationPlannfication, ListPlannification, validationPlannification, EnvoiMail, getUser } from "../services/api";
import ConfirmationModal from "../components/ConfirmationModal";

function Validation() {
  const [plannifications, setPlannifications] = useState([]);
  const [toutplannification, setToutPlannifications] = useState([]);
  const [message, setMessage] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("tous");
  const [utilisateur, setUtilisateur] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ListeValidationPlannfication(); 
        setPlannifications(data);
        const toutdata = await ListPlannification(); 
        setToutPlannifications(toutdata);
        const dataUtilisateur = await getUser();
        setUtilisateur(dataUtilisateur);
      } catch (error) {
        setMessage(error.message);
      }
    };
    fetchData();
  }, []);

  const openDetailModal = (plannif) => {
    setSelected({ ...plannif });
    setShowDetailModal(true);
  };

  const normalizeStatus = (status) => {
    if (!status) return "";
    return status
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const getEtatName = (plannification) => {
    return (
      plannification?.etat_nameplannification ||
      plannification?.etat_name ||
      plannification?.etatp_name ||
      plannification?.etat?.etatp_name ||
      ""
    );
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
  const closeModals = () => {
    setShowDetailModal(false);
    setSelected(null);
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



  const handleUpdate = async (plannification) => {
    setLoadingId(plannification.plan_id);
    try {
      const updated = await validationPlannification(plannification.plan_id);
      
      // Envoyer un mail de confirmation de validation
      await EnvoiMail(
        "plannification_budget_valider",
        "akjeachan@gmail.com",
        {
          userName: utilisateur?.user_name || "Utilisateur",
          departement: utilisateur?.dept_name || "Non spécifié",
          date: new Date().toLocaleDateString('fr-FR'),
          projet: plannification.prod_name || "N/A",
          montant: plannification.plan_montanttotal?.toLocaleString('fr-FR') || "0",
          description: `Validation de ${plannification.plan_nombredemande} unité(s) de ${plannification.prod_name}`
        }
      );
      
      setMessage("La plannification a été validée ✅ et un mail de confirmation a été envoyé.");
      setPlannifications((prev) =>
        prev.map((p) => (p.plan_id === updated.plan_id ? updated : p))
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Fonction pour déterminer le badge selon le statut
  const getStatusBadge = (etatpName) => {
    const normalized = normalizeStatus(etatpName);

    if (normalized === "valide") return "badge-success";
    if (normalized === "non valide" || normalized === "en attente" || normalized === "a valider" || normalized === "a valide") return "badge-warning";
    if (normalized === "rejete") return "badge-danger";
    return "badge-info";
  };

  const getStatusColor = (etatpName) => {
    const normalized = normalizeStatus(etatpName);

    if (normalized === "valide") return "#10b981";
    if (normalized === "non valide" || normalized === "en attente" || normalized === "a valider" || normalized === "a valide") return "#f59e0b";
    if (normalized === "rejete") return "#ef4444";
    return "#3b82f6";
  };

  // Calculer le montant maximum pour le graphique
  const filteredPlannifications = toutplannification.filter(p => {
    if (filterStatus === "tous") return true;

    const statusNormalized = normalizeStatus(getEtatName(p));
    const filterNormalized = normalizeStatus(filterStatus);

    return statusNormalized === filterNormalized;
  });

  const maxMontant = filteredPlannifications.length > 0
    ? Math.max(...filteredPlannifications.map(p => p.plan_montanttotal || 0))
    : 0;


  return (
    <div style={{ padding: "40px" }}>
      <h1>Validation des Plannifications</h1>
      {message && <p className="message message-info">{message}</p>}

      {/* Section Graphique */}
      {toutplannification.length > 0 && (
        <div style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}>
          <h2 style={{ marginBottom: "20px", color: "#333" }}>📊 Graphique des Montants Totaux</h2>

          {/* Boutons de filtre */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
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
                fontSize: "14px"
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
                fontSize: "14px"
              }}
            >
              Validé
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
                fontSize: "14px"
              }}
            >
              Non validé
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
                fontSize: "14px"
              }}
            >
              Rejeté
            </button>
          </div>

          {filteredPlannifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
              Aucune plannification avec le statut "{filterStatus}"
            </div>
          ) : (
            <>
              <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "15px",
                height: "300px",
                padding: "20px",
                backgroundColor: "white",
                borderRadius: "8px",
                overflowX: "auto",
              }}>
                {filteredPlannifications.map((p, index) => {
                  const height = maxMontant > 0 ? (p.plan_montanttotal / maxMontant) * 100 : 0;
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: "80px",
                        flex: "0 0 auto",
                      }}
                    >
                      {/* Barre */}
                      <div
                        style={{
                          width: "60px",
                          height: `${height}%`,
                          backgroundColor: getStatusColor(getEtatName(p)),
                          borderRadius: "8px 8px 0 0",
                          position: "relative",
                          transition: "all 0.3s ease",
                          minHeight: "20px",
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
                        {/* Montant au-dessus de la barre */}
                        <div style={{
                          position: "absolute",
                          top: "-25px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#333",
                          whiteSpace: "nowrap",
                        }}>
                          {(p.plan_montanttotal / 1000).toFixed(0)}k
                        </div>
                      </div>

                      {/* Nom du produit */}
                      <div style={{
                        marginTop: "8px",
                        fontSize: "11px",
                        textAlign: "center",
                        color: "#666",
                        maxWidth: "80px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }} title={p.prod_name}>
                        {p.prod_name}
                      </div>

                      {/* Badge statut */}
                      <div style={{
                        marginTop: "4px",
                        padding: "2px 8px",
                        fontSize: "10px",
                        borderRadius: "12px",
                        backgroundColor: getStatusColor(getEtatName(p)),
                        color: "white",
                        fontWeight: "500",
                      }}>
                        {getStatusText(getEtatName(p))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Statistiques */}
              <div style={{
                display: "flex",
                gap: "20px",
                marginTop: "20px",
                justifyContent: "space-around",
                flexWrap: "wrap",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>Nombre</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
                    {filteredPlannifications.length}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>Total</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
                    {filteredPlannifications.reduce((sum, p) => sum + (p.plan_montanttotal || 0), 0).toLocaleString('fr-FR')} Ar
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>Moyenne</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
                    {filteredPlannifications.length > 0
                      ? Math.round(filteredPlannifications.reduce((sum, p) => sum + (p.plan_montanttotal || 0), 0) / filteredPlannifications.length).toLocaleString('fr-FR')
                      : 0} Ar
                  </div>
                </div>
              </div>

              {/* Légende */}
              <div style={{
                display: "flex",
                gap: "15px",
                marginTop: "20px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}>
                {[
                  { label: "Validé", color: "#10b981" },
                  { label: "Non validé", color: "#f59e0b" },
                  { label: "Rejeté", color: "#ef4444" }
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: item.color,
                      borderRadius: "4px",
                    }} />
                    <span style={{ fontSize: "13px", color: "#666" }}>{item.label}</span>
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
              <th>ID</th>
              <th>Produit</th>
              <th>Prix Unitaire</th>
              <th>Quantité</th>
              <th>Montant Total</th>
              <th>Departement</th>
              <th className="text-center">Statut</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plannifications.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">
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
                  <td>{p.plan_prixunitaire?.toLocaleString("fr-FR")} Ar</td>
                  <td>{p.plan_nombredemande}</td>
                  <td>{p.plan_montanttotal?.toLocaleString("fr-FR")} Ar</td>
                  <td>{p.dept_name}</td>
                  <td className="text-center">
                    <span className={`badge ${getStatusBadge(getEtatName(p))}`}>
                      {getStatusText(getEtatName(p))}
                    </span>

                  </td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="table-actions">
                      {canValidateStatus(getEtatName(p)) ? (
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setConfirmAction(() => () => handleUpdate(p));
                            setShowConfirmation(true);
                          }}
                          disabled={loadingId === p.plan_id}
                          style={{
                            opacity: loadingId === p.plan_id ? 0.6 : 1,
                            cursor: loadingId === p.plan_id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {loadingId === p.plan_id ? '⏳ Traitement...' : 'Valider'}
                        </button>
                      ) : (
                        <button className="btn-primary" onClick={() => openDetailModal(p)}>
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

      {/* Modal de détails (lecture seule) */}
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
        isLoading={loadingId !== null}
      />
    </div>
  );
}

export default Validation;
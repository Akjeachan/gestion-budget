import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { plannification, ListeRubrique, getProduits, EnvoiMail, getUser } from "../services/api";

function Plannification() {
  const [rubrique, setRubrique] = useState("");
  const [rubriquesDisponibles, setRubriquesDisponibles] = useState([]);
  const [produitsDisponibles, setProduitsDisponibles] = useState([]);
  const [detailsProduits, setDetailsProduits] = useState([]);
  const [utilisateur, setUtilisateur] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataRubriques = await ListeRubrique();
        setRubriquesDisponibles(dataRubriques);
        const dataUtilisateur = await getUser();
        setUtilisateur(dataUtilisateur);
        
        const dataProduits = await getProduits();
        setProduitsDisponibles(dataProduits);
      } catch (error) {
        setMessage(error.message);
      }
    };
    fetchData();
  }, []);

  // Filtrer les produits par rubrique sélectionnée
  const produitsFiltres = rubrique
    ? produitsDisponibles.filter(p => p.prod_rubriqueref === rubrique)
    : [];

  const toggleProduit = (produitId, produitNom) => {
    const existe = detailsProduits.find(p => p.produitId === produitId.toString());
    
    if (existe) {
      // Décocher : retirer le produit
      setDetailsProduits(detailsProduits.filter(p => p.produitId !== produitId.toString()));
    } else {
      // Cocher : ajouter le produit
      setDetailsProduits([
        ...detailsProduits,
        {
          id: Date.now(),
          produitId: produitId.toString(),
          produitNom: produitNom,
          prixUnitaire: "",
          quantite: "",
          montant: 0
        }
      ]);
    }
  };

  const modifierLigneProduit = (produitId, champ, valeur) => {
    setDetailsProduits(
      detailsProduits.map((ligne) => {
        if (ligne.produitId === produitId) {
          const nouvelleLigne = { ...ligne, [champ]: valeur };

          // Calculer le montant automatiquement
          if (champ === "prixUnitaire" || champ === "quantite") {
            const prix = parseFloat(champ === "prixUnitaire" ? valeur : ligne.prixUnitaire) || 0;
            const qte = parseFloat(champ === "quantite" ? valeur : ligne.quantite) || 0;
            nouvelleLigne.montant = prix * qte;
          }

          return nouvelleLigne;
        }
        return ligne;
      })
    );
  };

  const montantTotal = detailsProduits.reduce((sum, ligne) => sum + (ligne.montant || 0), 0);

  const handlePlannification = async () => {
    setLoading(true);
    try {
      if (!rubrique || detailsProduits.length === 0) {
        setMessage("Veuillez sélectionner une rubrique et au moins un produit.");
        setLoading(false);
        return;
      }
      const produitsInvalides = detailsProduits.some(
        p => !p.produitId || !p.prixUnitaire || !p.quantite
      );
      if (produitsInvalides) {
        setMessage("Veuillez remplir tous les champs de chaque produit sélectionné.");
        setLoading(false);
        return;
      }

      // 1) Créer les plannifications (parallèle)
      const createResults = await Promise.all(
        detailsProduits.map(detail =>
          plannification(
            parseInt(detail.produitId, 10),
            parseFloat(detail.prixUnitaire),
            parseInt(detail.quantite, 10),
            description || `Plannification pour ${detail.produitNom}`
          )
        )
      );

      // 2) Envoyer un mail de résumé (après création)
      await EnvoiMail(
        "plannification_budget",
        "akjeachan@gmail.com",
        {
          userName: utilisateur?.user_name || "Utilisateur",
          departement: utilisateur?.dept_name || "Non spécifié",
          date: new Date().toLocaleDateString('fr-FR'),
          projet: rubrique || "Budget",
          montant: montantTotal.toLocaleString('fr-FR'),
          description: description || `${detailsProduits.length} produit(s) planifié(s)`
        }
      );

      setMessage(`✅ ${createResults.length} plannification(s) créée(s) et mail envoyé.`);
      setTimeout(() => navigate("/listplannification"), 1500);
    } catch (error) {
      setMessage("Erreur : " + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>
          📅 Planification
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Créez une nouvelle planification budgétaire par rubrique
        </p>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px",
          background: message.includes("Erreur") ? "#fee2e2" : "#d1fae5",
          border: `1px solid ${message.includes("Erreur") ? "#fca5a5" : "#6ee7b7"}`,
          borderRadius: "8px",
          color: message.includes("Erreur") ? "#991b1b" : "#065f46",
          marginBottom: "20px",
          fontSize: "14px"
        }}>
          {message}
        </div>
      )}

      {/* Sélection de la rubrique */}
      <div style={{
        background: "#e5e7eb",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "24px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px"
        }}>
          <label style={{
            fontSize: "15px",
            fontWeight: "600",
            color: "#374151"
          }}>
            Sélectionnez une rubrique
          </label>
          <div style={{
            width: "0",
            height: "0",
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "12px solid #818cf8"
          }} />
        </div>

        <select
          value={rubrique}
          onChange={(e) => {
            setRubrique(e.target.value);
            setDetailsProduits([]); // Réinitialiser les produits quand on change de rubrique
          }}
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            background: "white",
            cursor: "pointer"
          }}
        >
          <option value="">-- Sélectionnez une rubrique --</option>
          {rubriquesDisponibles.map((r) => (
            <option key={r.rub_reference} value={r.rub_reference}>
              {r.rub_nom}
            </option>
          ))}
        </select>
      </div>

      {/* Section des produits */}
      {rubrique && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "350px 1fr",
          gap: "24px",
          marginBottom: "24px"
        }}>
          {/* Liste des produits avec checkboxes */}
          <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "24px",
            height: "fit-content"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#111827",
                margin: 0
              }}>
                Produits disponibles
              </h3>
              <Link to="/produit">
                <button style={{
                  padding: "6px 12px",
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "#374151",
                  fontWeight: "500",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => e.target.style.background = "#e5e7eb"}
                onMouseOut={(e) => e.target.style.background = "#f3f4f6"}
                >
                  ➕ Nouveau
                </button>
              </Link>
            </div>

            {produitsFiltres.length === 0 ? (
              <div style={{
                padding: "40px 20px",
                textAlign: "center",
                background: "#f9fafb",
                borderRadius: "8px",
                border: "1px dashed #d1d5db"
              }}>
                <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                  Aucun produit dans cette rubrique
                </p>
              </div>
            ) : (
              <div style={{
                maxHeight: "500px",
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "8px"
              }}>
                {produitsFiltres.map((p) => (
                  <label
                    key={p.prod_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      cursor: "pointer",
                      borderRadius: "6px",
                      transition: "background 0.2s",
                      marginBottom: "4px",
                      background: detailsProduits.find(d => d.produitId === p.prod_id.toString()) ? "#e0e7ff" : "transparent"
                    }}
                    onMouseOver={(e) => {
                      if (!detailsProduits.find(d => d.produitId === p.prod_id.toString())) {
                        e.currentTarget.style.background = "#f3f4f6";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!detailsProduits.find(d => d.produitId === p.prod_id.toString())) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={detailsProduits.some(d => d.produitId === p.prod_id.toString())}
                      onChange={() => toggleProduit(p.prod_id, p.prod_name)}
                      style={{
                        marginRight: "12px",
                        cursor: "pointer",
                        width: "18px",
                        height: "18px",
                        accentColor: "#818cf8"
                      }}
                    />
                    <span style={{
                      fontSize: "14px",
                      color: "#374151",
                      fontWeight: detailsProduits.find(d => d.produitId === p.prod_id.toString()) ? "600" : "400"
                    }}>
                      {p.prod_name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Détails des produits sélectionnés */}
          <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "24px"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "20px",
              margin: 0
            }}>
              Détails des produits sélectionnés ({detailsProduits.length})
            </h3>

            {detailsProduits.length === 0 ? (
              <div style={{
                padding: "60px 20px",
                textAlign: "center",
                background: "#f9fafb",
                borderRadius: "8px",
                border: "1px dashed #d1d5db"
              }}>
                <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
                  Sélectionnez des produits à gauche pour commencer
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "20px" }}>
                  {detailsProduits.map((ligne) => (
                    <div
                      key={ligne.produitId}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 120px",
                        gap: "12px",
                        marginBottom: "12px",
                        alignItems: "end",
                        padding: "16px",
                        background: "#f3f4f6",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb"
                      }}
                    >
                      {/* Nom du produit */}
                      <div>
                        <label style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "6px",
                          fontWeight: "500"
                        }}>
                          Produit
                        </label>
                        <div style={{
                          padding: "10px",
                          background: "#e0e7ff",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151"
                        }}>
                          {ligne.produitNom}
                        </div>
                      </div>

                      {/* Prix unitaire */}
                      <div>
                        <label style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "6px",
                          fontWeight: "500"
                        }}>
                          Prix unitaire (Ar)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={ligne.prixUnitaire}
                          onChange={(e) =>
                            modifierLigneProduit(ligne.produitId, "prixUnitaire", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "13px",
                            background: "#bef264"
                          }}
                        />
                      </div>

                      {/* Quantité */}
                      <div>
                        <label style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "6px",
                          fontWeight: "500"
                        }}>
                          Quantité
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={ligne.quantite}
                          onChange={(e) =>
                            modifierLigneProduit(ligne.produitId, "quantite", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "13px",
                            background: "#bef264"
                          }}
                        />
                      </div>

                      {/* Montant calculé */}
                      <div style={{
                        textAlign: "right",
                        paddingTop: "20px"
                      }}>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#111827"
                        }}>
                          {ligne.montant.toLocaleString('fr-FR')} Ar
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Montant total */}
                <div style={{
                  background: "#f9fafb",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#374151"
                  }}>
                    Montant Total :
                  </span>
                  <span style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827"
                  }}>
                    {montantTotal.toLocaleString('fr-FR')} Ar
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Description globale */}
      {rubrique && (
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "8px"
          }}>
            Description générale (optionnel)
          </label>
          <textarea
            placeholder="Décrivez votre planification globale..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
        </div>
      )}

      {/* Boutons d'action */}
      <div style={{
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end"
      }}>
        <Link to="/listplannification">
          <button style={{
            padding: "12px 24px",
            background: "white",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            color: "#374151",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.target.style.background = "#f9fafb"}
          onMouseOut={(e) => e.target.style.background = "white"}
          >
            📋 Voir la liste
          </button>
        </Link>

        <button
          onClick={handlePlannification}
          disabled={!rubrique || detailsProduits.length === 0 || loading}
          style={{
            padding: "12px 32px",
            background: (!rubrique || detailsProduits.length === 0 || loading) ? "#d1d5db" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: (!rubrique || detailsProduits.length === 0 || loading) ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            opacity: loading ? 0.6 : 1
          }}
          onMouseOver={(e) => {
            if (rubrique && detailsProduits.length > 0 && !loading) {
              e.target.style.background = "#059669";
            }
          }}
          onMouseOut={(e) => {
            if (rubrique && detailsProduits.length > 0 && !loading) {
              e.target.style.background = "#10b981";
            }
          }}
        >
          {loading ? "⏳ Traitement en cours..." : "✅ Créer la planification"}
        </button>
      </div>
    </div>
  );
}

export default Plannification;
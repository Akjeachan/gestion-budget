import { useState, useEffect } from "react";
import { ListRealisationValider, ClotureRealisation } from "../services/api";
import { useNavigate } from "react-router-dom";

function Cloture() {
  const [realisation, setRealisation] = useState([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ListRealisationValider();
        setRealisation(data);
      } catch (error) {
        setMessage(error.message);
      }
    };
    fetchData();
  }, []);

  const openModal = (realisation) => {
    setSelected({ ...realisation });
    setPrixunitaire(realisation.real_prixunitaire || "");
    setDescription(realisation.real_description || "");
    setDescription(realisation.real_image || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setPrixunitaire("");
    setDescription("");
    setImage(null);
  };

  const handleRealisation = async () => {
    try {
      if (!prixunitaire || !description || !image) {
        setMessage("Veuillez remplir tous les champs correctement.");
        return;
      }

      const formData = new FormData();
      formData.append("prixunitaire", prixunitaire);
      formData.append("description", description);
      formData.append("plan_id", selected.plan_id);
      formData.append("image", image);

      const data = await ModificationRealisation
      
      (formData);

      setMessage(
        "Insertion Réalisation réussie : " +
          data.real_prixunitaire +
          " " +
          data.real_description
      );

      navigate("/listrealisation");
    } catch (error) {
      setMessage(error.message);
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
      <h1>Liste des Réalisations</h1>
      {message && <p className="message message-info">{message}</p>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Produit</th>
              <th>Montant Total Realisation</th>
              <th>Prix Unitaire Realisation</th>
              <th>Prix Unitaire Plannification</th>
              <th>Quantité</th>
              <th>Montant Total Plannification</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {realisation.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">
                  Aucune aucune Réalisation trouvée
                </td>
              </tr>
            ) : (
              realisation.map((r) => (
                <tr key={r.real_id}>
                  <td>{r.prod_name}</td>
                  <td>{r.real_montantreel?.toLocaleString("fr-FR")} Ar</td>
                  <td>{r.real_prixunitaire?.toLocaleString("fr-FR")} Ar</td>
                  <td>{r.plan_prixunitaire?.toLocaleString("fr-FR")} Ar</td>
                  <td>{r.plan_nombredemande}</td>
                  <td>{r.plan_montanttotal?.toLocaleString("fr-FR")} Ar</td>
                  <td className="text-center">
                    <span
                      className={`badge ${getStatusBadge(r.etat?.etatp_name)}`}
                    >
                      {r.etat?.etatp_name || "En attente"}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="table-actions">
                      <button
                        className="btn-primary"
                        onClick={() => openModal(r)}
                      >
                        Modification
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
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
            <h2>Réalisation</h2>
            <div className="form-group">
              <label>Image :</label>
              <input
                type="file"
                className="custom-file-input"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </div>
            <div className="form-group">
              <label>Prix Unitaire:</label>
              <input
                type="number"
                step="0.01"
                value={prixunitaire}
                onChange={(e) => setPrixunitaire(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="button-group">
              <button onClick={handleRealisation}>Enregistrer</button>
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

export default Cloture;
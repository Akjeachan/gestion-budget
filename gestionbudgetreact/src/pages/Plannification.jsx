import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { plannification, getProduits } from "../services/api";

function Plannification() {
  const [produit, setProduit] = useState("");
  const [prixunitaire, setPrixunitaire] = useState("");
  const [nombredemande, setNombredemande] = useState("");
  const [description, setDescription] = useState("");
  const [produitsDisponibles, setProduitsDisponibles] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const data = await getProduits();
        setProduitsDisponibles(data);
      } catch (error) {
        setMessage(error.message);
      }
    };
    fetchProduits();
  }, []);

  const handlePlannification = async () => {
    try {
      if ( !produit || !prixunitaire || !nombredemande) {
        setMessage("Veuillez remplir tous les champs correctement.");
        return;
      }

      const data = await plannification(
        parseInt(produit),
        parseFloat(prixunitaire),
        parseInt(nombredemande),
        description
      );

      setMessage("Insertion Plannification réussie : " + JSON.stringify(data));
      navigate("/listplannification");
    } catch (error) {
      setMessage("Erreur : " + error.message);
    }
  };

  return (
    <div className="form-container">
      <h1>📅 Plannification</h1>
      <p>Créez une nouvelle plannification budgétaire</p>

      <div className="form-group">
        <label>Produit</label>
        <select value={produit} onChange={(e) => setProduit(e.target.value)}>
          <option value="">-- Sélectionnez un produit --</option>
          {produitsDisponibles.map((p) => (
            <option key={p.prod_id} value={p.prod_id}>
              {p.prod_name}
            </option>
          ))}
        </select>
        <Link to="/produit">
          <button className="btn-secondary mt-1">➕ Ajouter un produit</button>
        </Link>
      </div>

      <div className="form-group">
        <label>Prix unitaire (Ar)</label>
        <input
          type="number"
          step="0.01"
          placeholder="Ex: 10000.00"
          value={prixunitaire}
          onChange={(e) => setPrixunitaire(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Nombre de demande</label>
        <input
          type="number"
          placeholder="Ex: 10"
          value={nombredemande}
          onChange={(e) => setNombredemande(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          placeholder="Décrivez votre plannification..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="button-group">
        <button onClick={handlePlannification}>✅ Ajouter Plannification</button>
        <Link to="/listplannification">
          <button className="btn-outline">📋 Voir la liste</button>
        </Link>
      </div>

      {message && <p className="message message-info">{message}</p>}
    </div>
  );
}

export default Plannification;
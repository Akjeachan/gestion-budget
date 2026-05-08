import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AjoutProduits, getNumeroCompte,ListeRubrique } from "../services/api";

function Produit() {
  const [comptes, setComptes] = useState([]);        // list of comptes
  const [rubriques, setRubrique] = useState([]);        // list of Rubrique
  const [selectedCompte, setSelectedCompte] = useState(""); // selected compte ID
  const [selectedrubrique, setSelectedrubrique] = useState(""); // selected Rubrique ID
  const [nomproduit, setNomProduit] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNumeroCompte = async () => {
      try {
        const data = await getNumeroCompte();
        setComptes(data); // keep array intact
        const data2 = await ListeRubrique();
        setRubrique(data2); // keep array intact
      } catch (error) {
        setMessage(error.message);
      }
    };
    fetchNumeroCompte();
  }, []);

  const handleProduit = async () => {
    try {
      if (!nomproduit || !selectedCompte) {
        setMessage("Veuillez remplir tous les champs correctement.");
        return;
      }

      const data = await AjoutProduits(nomproduit, selectedCompte,selectedrubrique);

      setMessage("Insertion Produit réussie : " + data.prod_name);
      navigate("/plannification");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Produit</h1>
      <label>Produit</label>
      <input
        type="text"
        placeholder="Nom du produit"
        value={nomproduit}
        onChange={(e) => setNomProduit(e.target.value)}
      />

      <br /><br />
      <div className="form-group">
        <label>Intitulé Numéro de Compte</label>
        <select
          value={selectedCompte}
          onChange={(e) => setSelectedCompte(e.target.value)}
        >
          <option value="">-- Sélectionnez un numéro de compte --</option>
          {Array.isArray(comptes) &&
            comptes.map((n) => (
              <option key={n.numcompt_id} value={n.numcompt_id}>
                {n.numcompt_intitule}
              </option>
            ))}
        </select>
      </div>
      <br /><br />
      <div className="form-group">
        <label>Rubrique</label>
        <select
          value={selectedrubrique}
          onChange={(e) => setSelectedrubrique(e.target.value)}
        >
          <option value="">-- Sélectionnez un rubrique --</option>
          {Array.isArray(rubriques) &&
            rubriques.map((n) => (
              <option key={n.rub_reference} value={n.rub_reference}>
                {n.rub_nom}
              </option>
            ))}
        </select>
      </div>

      <button onClick={handleProduit}>Ajouter Produit</button>

      <p>{message}</p>
    </div>
  );
}

export default Produit;
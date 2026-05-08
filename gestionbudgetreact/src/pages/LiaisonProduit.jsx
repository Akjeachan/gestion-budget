import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AjoutProduits,ListeRubrique,ListeArticle } from "../services/api";
import MultiSelectArticles from "../components/MultiSelectArticles";

function LiaisonProduit() {
  const [rubriques, setRubrique] = useState([]);        // list of Rubrique
  const [article, setArticle] = useState([]);        // list of Article
  const [selectedarticles, setSelectedArticles] = useState([]); // selected articles refs (array)
  const [selectedrubrique, setSelectedrubrique] = useState(""); // selected Rubrique ID
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNumeroCompte = async () => {
      try {
        const data = await ListeArticle();
        setArticle(data); // keep array intact
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
      if (selectedarticles.length === 0 || !selectedrubrique) {
        setMessage("Veuillez sélectionner au moins un article et une rubrique.");
        return;
      }

      setIsLoading(true);
      const results = [];
      const errors = [];

      // Ajouter chaque article sélectionné
      for (const articleRef of selectedarticles) {
        try {
          const data = await AjoutProduits(articleRef, selectedrubrique);
          results.push(data.prod_name);
        } catch (error) {
          const articleName = article.find(a => a.aR_Ref === articleRef)?.aR_Design || articleRef;
          errors.push(`${articleName}: ${error.message}`);
        }
      }

      if (results.length > 0) {
        const successMsg = `${results.length} produit(s) ajouté(s) avec succès: ${results.join(", ")}`;
        setMessage(successMsg);
        
        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
          setSelectedArticles([]);
          setSelectedrubrique("");
          navigate("/plannification");
        }, 2000);
      }

      if (errors.length > 0) {
        setMessage(`Erreur(s): ${errors.join(" | ")}`);
      }
    } catch (error) {
      setMessage("Erreur: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Produit</h1>
      
      <div className="form-group">
        <label>Articles</label>
        <MultiSelectArticles
          articles={article}
          selectedArticles={selectedarticles}
          onChange={setSelectedArticles}
        />
      </div>
      <br />
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

      <button 
        onClick={handleProduit}
        disabled={isLoading || selectedarticles.length === 0}
        style={{
          opacity: isLoading || selectedarticles.length === 0 ? 0.6 : 1,
          cursor: isLoading || selectedarticles.length === 0 ? 'not-allowed' : 'pointer',
          backgroundColor: selectedarticles.length === 0 ? '#d1d5db' : '#667eea',
          color: 'white',
          padding: '10px 24px',
          borderRadius: '6px',
          border: 'none',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
      >
        {isLoading ? "⏳ Ajout en cours..." : `Ajouter ${selectedarticles.length > 0 ? selectedarticles.length : ''} Produit(s)`}
      </button>

      <p>{message}</p>
    </div>
  );
}

export default LiaisonProduit;
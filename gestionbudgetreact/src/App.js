import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import Admin from "./pages/Admin";
import Utilisateur from "./pages/Utilisateur";
import Controleur from "./pages/Controleur";
import Plannification from "./pages/Plannification";
import Produit from "./pages/LiaisonProduit";
import ListPLannification from "./pages/ListPlannification";
import Validation from "./pages/Validation";
import ListeRealisation from "./pages/ListRealisation";
import Reaffectation from "./pages/Reaffectation";
import ListePlannificationRealisation from "./pages/ListPlannificationRealisation";
import ListeRealisationAdmin from "./pages/ListRealisationAdmin";
import ListeRealisationCloture from "./pages/ListeRealisationCloture";
import ListeBonPrecommande from "./pages/ListeBonPrecommande"; import Comparaison from "./pages/Comparaison";
import DebugBonPrecommande from "./pages/DebugBonPrecommande";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/utilisateur" element={<Utilisateur />} />
        <Route path="/controleur" element={<Controleur />} />
        <Route path="/plannification" element={<Plannification />} />
        <Route path="/produit" element={<Produit />} />
        <Route path="/listplannification" element={<ListPLannification />} />
        <Route path="/validation" element={<Validation />} />
        <Route path="/listplannificationrealisation" element={<ListePlannificationRealisation />} />
        <Route path="/listrealisation" element={<ListeRealisation />} />
        <Route path="/reaffectation" element={<Reaffectation />} />
        <Route path="/listrealisationencours" element={<ListeRealisationAdmin />} />
        <Route path="/listRealisationCloture" element={<ListeRealisationCloture />} />
        <Route path="/listbonprecommande" element={<ListeBonPrecommande />} />
        <Route path="/comparaison" element={<Comparaison />} />
        <Route path="/debugbonprecommande" element={<DebugBonPrecommande />} />
      </Routes>
    </Router>
  );
}

export default App;

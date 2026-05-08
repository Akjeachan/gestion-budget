import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

function LoginForm() {
    const [identifiant, setIdentifiant] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const data = await loginUser(identifiant, password);
            setMessage("Connexion réussie : " + data);
            if (data.role === "Direction") navigate("/admin");
            else if (data.role === "Utilisateur") navigate("/utilisateur");
            else if (data.role === "Controleur de Gestion") navigate("/controleur");
            else setMessage("Rôle non reconnu : " + data.role);
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <div className="auth-container">
          <h1 style={{ display: "flex", alignItems: "center" }}>
  <img
    src="Softwell.png"
    alt="Logo"
    style={{ width: "100px", marginRight: "20px" }}
  />
  <span>Soft Budget</span>
</h1>

<p>Connectez-vous pour accéder à votre espace</p>

            <div className="form-group">
                <label>Identifiant</label>
                <input
                    type="text"
                    placeholder="Entrez votre identifiant"
                    value={identifiant}
                    onChange={(e) => setIdentifiant(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Mot de passe</label>
                <input
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button onClick={handleLogin}>Se connecter</button>

            {message && <p className="message message-info">{message}</p>}
        </div>
    );
}

export default LoginForm;
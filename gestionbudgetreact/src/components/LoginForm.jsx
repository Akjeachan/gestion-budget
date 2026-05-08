import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

function LoginForm() {
    const [identifiant, setIdentifiant] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            e.preventDefault();
            const data = await loginUser(identifiant, password);
            setMessage("Connexion réussie : " + data);
            if (data.role === "Admin") navigate("/admin");
            else if (data.role === "Utilisateur") navigate("/utilisateur");
            else setMessage("Rôle non reconnu : " + data.role);
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <div className="auth-container">
            <h1>
                <img
                    src="Softwell.png"
                    alt="Logo"
                />
                <span>Soft Budget</span>
            </h1>

            <p>Connectez-vous pour accéder à votre espace</p>

        <form onSubmit={handleLogin}>
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

            <button type="submit">Se connecter</button>
            </form>

            {message && <p className="message message-info">{message}</p>}
        </div>
    );
}

export default LoginForm;
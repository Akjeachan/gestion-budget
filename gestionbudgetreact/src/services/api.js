export const Api_Authentification = "http://localhost:5179/api/authentification";
export const Api_Plannification = "http://localhost:5179/api/plannification";
export const Api_Cloture = "http://localhost:5179/api/cloture";
export const Api_BonPrecommande = "http://localhost:5179/api/bonprecommande";
export const Api_Rubrique = "http://localhost:5179/api/rubrique";
export const Api_Utilisateur = "http://localhost:5179/api/user";

export const getUser = async () => {
    const userId = sessionStorage.getItem("user_id");
    const response = await fetch(Api_Utilisateur + "/" + userId);
    if (!response.ok) {
        throw new Error("Impossible de récupérer l'utilisateur");
    }
    return await response.json();
};
export const loginUser = async (identifiant, password) => {
    const response = await fetch(Api_Authentification + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_identifiant: identifiant, user_password: password })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erreur de connexion serveur");
    }

    const data = await response.json();
    if (data.user_id) {
        sessionStorage.setItem("user_id", data.user_id);
    }

    return data;
};
export const ListeValidationPlannfication = async () => {
    const response = await fetch(Api_Plannification + "/avalider");
    if (!response.ok) {
        throw new Error("Impossible de récupérer les plannification");
    }
    return await response.json();
};
export const ListeRubrique = async () => {
    const response = await fetch(Api_Rubrique);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les rubriques");
    }
    return await response.json();
}
export const ListeArticle = async () => {
    const response = await fetch(Api_Rubrique+'/articleunique');
    if (!response.ok) {
        throw new Error("Impossible de récupérer les articles");
    }
    return await response.json();
}
export const ListePlannification = async () => {
    const response = await fetch(Api_Plannification);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les plannification");
    }
    return await response.json();
}

export const Api_User = "http://localhost:5179/api/user"
export const User = async () => {
    const user_id = sessionStorage.getItem("user_id");
    const response = await fetch(Api_User + "/" + user_id);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les utilisateurs");
    }
    return await response.json();
}
export const plannification = async (produit, prixunitaire, nombredemande, description) => {
    const userId = sessionStorage.getItem("user_id");

    const response = await fetch(Api_Plannification, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            plan_produitid: produit, // produit est déjà un nombre
            plan_prixunitaire: prixunitaire,
            plan_nombredemande: nombredemande,
            plan_createdby: userId,
            plan_description: description
        })
    });

    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
};
export const Api_NumeroCompte = "http://localhost:5179/api/numerocompte";
export const getNumeroCompte = async () => {
    const response = await fetch(Api_NumeroCompte);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les numero de compte");
    }
    return await response.json();
};
export const Api_Produit = "http://localhost:5179/api/produit";

export const getProduits = async () => {
    const response = await fetch(Api_Produit);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les produits");
    }
    return await response.json();
};
export const AjoutProduits = async ( article,rubriqueref) => {

    const response = await fetch(Api_Produit, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prod_articleref: article,
            prod_rubriqueref: rubriqueref

        })
    });

    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();

}
export const ListPlannification = async () => {
    const userId = sessionStorage.getItem("user_id");
    const response = await fetch(Api_Plannification + "/utilisateur/" + userId);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les plannification");
    }
    return await response.json();
};
export const ListBonprecommandeavalider = async () => {
    const userId = sessionStorage.getItem("user_id");
    const response = await fetch(Api_BonPrecommande + "/" + userId);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les Bon precommande");
    }
    return await response.json();
};
// export const ValidationBonprecommande = async (id, formData) => {
//     const response = await fetch(Api_Validation + "/" + id + "/ValidationPrecommande", {
//         method: "PUT",
//         body: formData,
//     });

//     if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
//     }

//     return await response.json();
// };
export const ValidationBonprecommande = async (id, data) => {
    try {
        console.log(`🌐 Appel API: PUT /api/Validation/${id}/ValidationPrecommande`);
        console.log("📦 Données envoyées:", data);

        // Détecter si c'est du FormData (avec image) ou du JSON
        const isFormData = data instanceof FormData;

        const options = {
            method: 'PUT',
            body: isFormData ? data : JSON.stringify(data)
        };

        // N'ajouter Content-Type que pour JSON (FormData le gère automatiquement)
        if (!isFormData) {
            options.headers = {
                'Content-Type': 'application/json',
            };
        }

        const response = await fetch(Api_Validation + "/" + id + "/ValidationPrecommande", options);

        console.log("📡 Statut de la réponse:", response.status);

        if (!response.ok) {
            // Lire le body UNE SEULE FOIS comme du texte
            const bodyText = await response.text();
            let errorData = {};
            
            // Essayer de le parser comme JSON
            try {
                errorData = JSON.parse(bodyText);
            } catch (e) {
                // Si ce n'est pas du JSON, prendre le texte brut
                errorData = { message: bodyText };
            }
            
            console.error("❌ Erreur API status:", response.status);
            console.error("❌ Erreur API body:", bodyText);
            console.error("❌ Erreur API data parsée:", errorData);
            
            const message = errorData.message || bodyText || `Erreur HTTP: ${response.status}`;
            throw new Error(message);
        }

        const result = await response.json();
        console.log("✅ Réponse API:", result);
        return result;
    } catch (error) {
        console.error("❌ Erreur dans ValidationBonprecommande:", error);
        throw error;
    }
};
export const Api_Realisation = "http://localhost:5179/api/realisation";
export const ListPlannificationRealisation = async () => {
    const userId = sessionStorage.getItem("user_id");
    const response = await fetch(Api_Realisation + "/utilisateur/" + userId);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les plannification");
    }
    return await response.json();
};
export const ListRealisationencours = async () => {
    const response = await fetch(Api_Realisation + "/realisationencours");
    if (!response.ok) {
        throw new Error("Impossible de récupérer les realisations");
    }
    return await response.json();
};
export const ListRealisationaCloture = async () => {
    const userId = sessionStorage.getItem("user_id");
    const response = await fetch(Api_Cloture + "/utilisateur/" + userId);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les realisations");
    }
    return await response.json();
};
export const RealisationCloture = async (id, formData) => {
    const response = await fetch(Api_Validation + "/autocloture/" + id, {
        method: "PUT",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
};
export const ListToutRealisation = async () => {
    const response = await fetch(Api_Realisation);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les realisations");
    }
    return await response.json();
};

export const Realisation = async (prixunitaire, description, idplannification, image) => {
    const formData = new FormData();
    formData.append("real_prixunitaire", prixunitaire);
    formData.append("real_description", description);
    if (image) {
        formData.append("image", image);
    }

    const response = await fetch(`${Api_Realisation}/${idplannification}`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
};

// ✅ VERSION CORRIGÉE
export const ModificationRealisation = async (id, formData) => {
    const response = await fetch(Api_Realisation + "/" + id, {
        method: "PUT",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
};
export const ValidationRealisation = async (id, formData) => {
    const response = await fetch(Api_Realisation + "/validation/" + id, {
        method: "PUT",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
};
export const updatePlannification = async (id, plannification) => {
    const response = await fetch(Api_Plannification + "/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plannification)
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
    }

    return await response.json();
};
export const Api_Validation = "http://localhost:5179/api/validation";

export const validationPlannification = async (id) => {
    const response = await fetch(`${Api_Validation}/validationdirection/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
    }

    return await response.json();
};
export const updateProduit = async (id) => {
    const response = await fetch(`${Api_Produit}/NumeroCompte/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
    }

    return await response.json();
};
export const Api_budget = "http://localhost:5179/api/budget";

export const getBudget = async () => {
    const response = await fetch(Api_budget);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les produits");
    }
    return await response.json();
};
export const getPlannificationByBudget = async (budgetId) => {
    const response = await fetch(`${Api_Plannification}/budget/${budgetId}`);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les planifications du budget");
    }
    return await response.json();
};

export const Api_reaffectation = "http://localhost:5179/api/reaffectation";
export const AjoutReaffectation = async (budget1, budget2, montantreaffectation, description) => {
    const response = await fetch(Api_reaffectation, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            reaffect_budget1id: budget1,
            reaffect_budget2id: budget2,
            reaffect_description: description,
            reaffect_montantreaffectation: montantreaffectation,
        })
    });

    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();

}
export const Api_EnvoiMail = "http://localhost:5179/api/EmailDiagnostic/test-template-and-send";
export const EnvoiMail = async (templateName, toEmail, parameters) => {
    const response = await fetch(Api_EnvoiMail, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            templateName: templateName,
            toEmail: toEmail,
            parameters: parameters
        })
    });

    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
};

export const Api_Comparaison = "http://localhost:5179/api/comparaison";

export const getComparaisonBudgets = async () => {
    const response = await fetch(`${Api_Comparaison}/budgets-vs-realisations`);
    if (!response.ok) {
        throw new Error("Impossible de récupérer la comparaison des budgets");
    }
    return await response.json();
};

export const getRealisations = async () => {
    const response = await fetch(`${Api_Comparaison}/realisations`);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les réalisations");
    }
    return await response.json();
};

export const getStatistiques = async () => {
    const response = await fetch(`${Api_Comparaison}/statistiques`);
    if (!response.ok) {
        throw new Error("Impossible de récupérer les statistiques");
    }
    return await response.json();
};

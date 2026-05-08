# 📧 Guide d'Installation des Templates Email

## 📁 Structure des Dossiers

Placez les templates dans votre projet ASP.NET Core selon cette structure :

```
VotreProjet/
├── Templates/
│   └── Email/
│       ├── plannification_budget.html
│       ├── plannification_budget_valider.html
│       ├── realisation_budget.html
│       └── realisation_budget_valider.html
├── Services/
│   ├── EmailService.cs
│   ├── IEmailService.cs
│   └── TemplateService.cs
└── Controllers/
    └── EnvoiMailController.cs
```

## 🎯 Templates Fournis

### 1. **plannification_budget.html**
- **Utilisation** : Nouvelle plannification de budget
- **Endpoint** : `POST /api/EnvoiMail/send-plannification`
- **Paramètres requis** :
  - `userName` : Nom de l'utilisateur
  - `departement` : Nom du département
  - `date` : Date de la plannification
  - `projet` : Nom du projet
  - `montant` : Montant du budget
  - `description` : Description détaillée

### 2. **plannification_budget_valider.html**
- **Utilisation** : Validation d'une plannification
- **Endpoint** : `POST /api/EnvoiMail/send-plannification-valider`
- **Paramètres requis** :
  - Tous les paramètres de plannification
  - `validateur` : Nom du validateur

### 3. **realisation_budget.html**
- **Utilisation** : Phase de réalisation du budget
- **Endpoint** : `POST /api/EnvoiMail/send-realisation`
- **Paramètres requis** : (identiques à plannification)

### 4. **realisation_budget_valider.html**
- **Utilisation** : Validation finale de la réalisation
- **Endpoint** : `POST /api/EnvoiMail/send-realisation-valider`
- **Paramètres requis** :
  - Tous les paramètres de réalisation
  - `validateur` : Nom du validateur

## 🔧 Configuration du TemplateService

Assurez-vous que votre `TemplateService` pointe vers le bon dossier :

```csharp
public class TemplateService : ITemplateService
{
    private readonly string _templatePath;

    public TemplateService(IWebHostEnvironment env)
    {
        _templatePath = Path.Combine(env.ContentRootPath, "Templates", "Email");
    }

    public async Task<string> RenderTemplateAsync(string templateName, Dictionary<string, string> parameters)
    {
        var templateFile = Path.Combine(_templatePath, $"{templateName}.html");
        
        if (!File.Exists(templateFile))
        {
            throw new FileNotFoundException($"Template {templateName} non trouvé");
        }

        var template = await File.ReadAllTextAsync(templateFile);
        
        // Remplacer les paramètres {{key}} par leurs valeurs
        foreach (var param in parameters)
        {
            template = template.Replace($"{{{{{param.Key}}}}}", param.Value);
        }

        return template;
    }

    public string GetTemplateSubject(string templateName, Dictionary<string, string> parameters)
    {
        return templateName switch
        {
            "plannification_budget" => $"Nouvelle Plannification - {parameters.GetValueOrDefault("projet", "Budget")}",
            "plannification_budget_valider" => $"Plannification Validée - {parameters.GetValueOrDefault("projet", "Budget")}",
            "realisation_budget" => $"Réalisation en cours - {parameters.GetValueOrDefault("projet", "Budget")}",
            "realisation_budget_valider" => $"Réalisation Validée - {parameters.GetValueOrDefault("projet", "Budget")}",
            _ => "Notification Budget"
        };
    }
}
```

## 📝 Enregistrement des Services

Dans `Program.cs` :

```csharp
builder.Services.AddScoped<ITemplateService, TemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();
```

## 🧪 Test des Templates

### 1. Test avec Dry Run (Simulation)
```bash
curl -X POST "http://localhost:5179/api/EnvoiMail/dry-run-plannification" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Jean Dupont",
    "departement": "Direction",
    "projet": "Budget 2026",
    "montant": "500000",
    "date": "06/02/2026",
    "description": "Plannification du budget annuel"
  }'
```

### 2. Test avec Email Spécifique (Mode DEBUG)
```bash
curl -X POST "http://localhost:5179/api/EnvoiMail/test-plannification" \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "votre.email@test.com",
    "userName": "Jean Dupont",
    "departement": "Direction",
    "projet": "Budget 2026",
    "montant": "500000",
    "date": "06/02/2026",
    "description": "Plannification du budget annuel"
  }'
```

### 3. Test Production (Envoi aux Admins)
```bash
curl -X POST "http://localhost:5179/api/EnvoiMail/send-plannification" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Jean Dupont",
    "departement": "Direction",
    "projet": "Budget 2026",
    "montant": "500000",
    "date": "06/02/2026",
    "description": "Plannification du budget annuel"
  }'
```

## 🎨 Personnalisation des Templates

Vous pouvez personnaliser les couleurs et styles :

### Plannification (Bleu)
```css
border-bottom: 3px solid #007bff;
background-color: #e7f3ff;
color: #007bff;
```

### Validation Plannification (Vert)
```css
border-bottom: 3px solid #28a745;
background-color: #d4edda;
color: #28a745;
```

### Réalisation (Orange)
```css
border-bottom: 3px solid #ffc107;
background-color: #fff8e1;
color: #ffc107;
```

### Validation Réalisation (Cyan)
```css
border-bottom: 3px solid #17a2b8;
background-color: #d1ecf1;
color: #17a2b8;
```

## ✅ Vérification de l'Installation

1. **Vérifier que les fichiers sont présents** :
```bash
ls -l Templates/Email/
```

2. **Tester la configuration** :
```
GET http://localhost:5179/api/EnvoiMail/test-config
```

3. **Vérifier les logs** :
- En cas de template manquant : "Template X introuvable, utilisation du template par défaut"
- En cas de succès : "Email envoyé avec succès à l'admin X"

## 🔍 Dépannage

### Template non trouvé
```
Erreur : Template plannification_budget non trouvé
```
**Solution** : Vérifiez le chemin dans `TemplateService` et assurez-vous que le fichier existe.

### Paramètres non remplacés
Si vous voyez `{{userName}}` dans l'email :
```csharp
// Vérifiez que les clés correspondent exactement
parameters.Add("userName", "Jean"); // ✓ Correct
parameters.Add("username", "Jean"); // ✗ Incorrect (minuscule)
```

### Email non envoyé aux admins
```
Erreur : Aucun administrateur trouvé dans le département Direction
```
**Solution** : Vérifiez qu'au moins un utilisateur existe dans le département Direction dans votre base de données.

## 📊 Workflow Complet

```
1. Plannification
   ↓ (Envoi plannification_budget.html)
   
2. Validation Plannification
   ↓ (Envoi plannification_budget_valider.html)
   
3. Réalisation
   ↓ (Envoi realisation_budget.html)
   
4. Validation Réalisation
   ↓ (Envoi realisation_budget_valider.html)
   
✓ Budget finalisé
```

## 🚀 Ordre de Test Recommandé

1. **Dry Run** → Vérifier la structure sans envoi
2. **Test Mode** → Envoyer à votre email de test
3. **Production** → Envoyer aux vrais admins

---

✅ **Installation terminée !** Vos templates sont maintenant prêts à être utilisés.

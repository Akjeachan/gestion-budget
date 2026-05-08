# 📧 Guide des Templates Email

## 📁 Emplacement des Templates

Les templates HTML pour l'envoi d'emails sont situés dans : `Templates/Email/`

## 📋 Templates Disponibles

1. **plannification_budget.html** - Nouvelle plannification de budget
2. **plannification_budget_valider.html** - Validation d'une plannification
3. **realisation_budget.html** - Réalisation de budget en cours
4. **realisation_budget_valider.html** - Validation d'une réalisation

## 🔧 Variables des Templates

Tous les templates utilisent des placeholders au format `{{variableName}}` qui sont remplacés dynamiquement.

### Variables Communes

- `{{userName}}` - Nom de l'utilisateur
- `{{departement}}` - Département de l'utilisateur
- `{{date}}` - Date de l'action
- `{{projet}}` - Nom du projet/rubrique
- `{{montant}}` - Montant du budget
- `{{description}}` - Description détaillée

### Variables Spécifiques aux Validations

- `{{validateur}}` - Nom de la personne qui valide (pour les templates *_valider.html)

## 🧪 Tester les Templates

### 1. Vérifier les Templates Disponibles

```http
GET http://localhost:5000/api/EmailDiagnostic/templates
```

Cette requête retourne :
- Le chemin des templates
- La liste de tous les fichiers HTML disponibles
- Les templates attendus par le système

### 2. Tester le Rendu d'un Template

```http
POST http://localhost:5000/api/EmailDiagnostic/test-template
Content-Type: application/json

{
  "templateName": "plannification_budget",
  "parameters": {
    "userName": "Jean Dupont",
    "departement": "Département IT",
    "date": "17/02/2026 10:30:00",
    "projet": "Migration Cloud",
    "montant": "5,000,000",
    "description": "Migration complète vers Azure Cloud"
  }
}
```

**Réponse** : Le HTML rendu avec tous les paramètres remplacés

### 3. Tester le Rendu ET l'Envoi

```http
POST http://localhost:5000/api/EmailDiagnostic/test-template-and-send
Content-Type: application/json

{
  "templateName": "plannification_budget",
  "toEmail": "votre.email@example.com",
  "parameters": {
    "userName": "Jean Dupont",
    "departement": "Département IT",
    "date": "17/02/2026 10:30:00",
    "projet": "Migration Cloud",
    "montant": "5,000,000",
    "description": "Migration complète vers Azure Cloud"
  }
}
```

**Réponse** : Envoi réel de l'email avec le template rendu

## 🚨 Problèmes Courants et Solutions

### Problème 1 : Template non trouvé

**Symptôme** : Erreur "Template non trouvé" lors de l'envoi d'email

**Causes possibles** :
1. Le fichier `.html` n'existe pas dans `Templates/Email/`
2. Le nom du template est incorrect (sensible à la casse)
3. Le dossier `Templates/Email/` n'existe pas

**Solution** :
```bash
# Vérifier les templates disponibles
GET /api/EmailDiagnostic/templates

# Le système créera automatiquement le dossier s'il n'existe pas
```

### Problème 2 : Variables non remplacées

**Symptôme** : Les placeholders `{{variable}}` apparaissent tels quels dans l'email

**Causes possibles** :
1. Le nom de la variable ne correspond pas exactement (sensible à la casse)
2. Les accolades ne sont pas doublées correctement
3. La variable n'a pas été passée dans le dictionnaire de paramètres

**Solution** :
- Vérifiez que les noms des variables correspondent exactement
- Format correct : `{{userName}}` (pas `{userName}` ou `{{ userName }}`)
- Consultez les logs pour voir les variables non trouvées

### Problème 3 : Template s'affiche mais email vide

**Symptôme** : Le template se charge mais l'email reçu est vide

**Causes possibles** :
1. Problème avec le type MIME (HTML vs Text)
2. Le client email bloque le HTML

**Solution** :
- Vérifiez que `IsHtml = true` dans l'EmailMessage
- Testez avec un client email différent
- Vérifiez les logs SMTP pour les erreurs

## 📝 Créer un Nouveau Template

1. Créez un fichier `.html` dans `Templates/Email/`
2. Utilisez le format `{{variableName}}` pour les variables dynamiques
3. Ajoutez le nom du template et son sujet dans `TemplateService.GetTemplateSubject()`
4. Testez avec l'endpoint de diagnostic

### Exemple de Template Minimal

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Notification</h1>
        <p><strong>Utilisateur :</strong> {{userName}}</p>
        <p><strong>Message :</strong> {{message}}</p>
    </div>
</body>
</html>
```

## 📊 Logs et Débogage

Le `TemplateService` génère des logs détaillés :

- ✅ **Information** : Template trouvé et rendu avec succès
- ⚠️ **Warning** : Placeholder non trouvé, paramètre manquant
- ❌ **Error** : Template non trouvé, erreur de lecture

Consultez les logs de l'application pour diagnostiquer les problèmes.

## 🔗 Endpoints de Diagnostic

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/EmailDiagnostic/templates` | GET | Liste tous les templates disponibles |
| `/api/EmailDiagnostic/test-template` | POST | Teste le rendu d'un template |
| `/api/EmailDiagnostic/test-template-and-send` | POST | Teste et envoie un email réel |
| `/api/EmailDiagnostic/config` | GET | Vérifie la configuration SMTP |
| `/api/EmailDiagnostic/test-connection` | POST | Teste la connexion SMTP |
| `/api/EmailDiagnostic/test-send` | POST | Envoie un email de test simple |

## 💡 Bonnes Pratiques

1. **Toujours tester** avec `/test-template` avant d'envoyer réellement
2. **Utiliser des paramètres par défaut** pour les variables optionnelles
3. **Logger les erreurs** pour faciliter le débogage
4. **Valider les emails** avant d'envoyer en production
5. **Sauvegarder** les templates dans le contrôle de version (Git)

## 🎨 Conseils de Design

- **Largeur maximale** : 600px pour la compatibilité email
- **CSS inline** : Préférez le CSS inline pour meilleure compatibilité
- **Images** : Utilisez des URLs absolues pour les images
- **Polices** : Utilisez des polices système (Arial, sans-serif)
- **Couleurs** : Utilisez des couleurs web-safe

## 📞 Support

Si les templates ne fonctionnent toujours pas après avoir suivi ce guide :

1. Vérifiez les logs de l'application
2. Utilisez les endpoints de diagnostic
3. Vérifiez que le dossier `Templates/Email/` existe
4. Vérifiez les permissions de lecture sur les fichiers
5. Contactez l'administrateur système

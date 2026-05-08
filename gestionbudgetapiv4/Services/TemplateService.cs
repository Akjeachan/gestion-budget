using System.Text;

namespace GESTIONBUDGETAPI.Services
{
    public class TemplateService : ITemplateService
    {
        private readonly string _templatePath;
        private readonly ILogger<TemplateService> _logger;

        public TemplateService(IWebHostEnvironment env, ILogger<TemplateService> logger)
        {
            _logger = logger;
            _templatePath = Path.Combine(env.ContentRootPath, "Templates", "Email");

            // Logging pour diagnostiquer les problèmes de chemins
            _logger.LogInformation("ContentRootPath: {ContentRootPath}", env.ContentRootPath);
            _logger.LogInformation("Templates path configuré: {TemplatePath}", _templatePath);

            // Vérifier si le dossier existe
            if (!Directory.Exists(_templatePath))
            {
                _logger.LogWarning(
                    "Le dossier de templates n'existe pas: {TemplatePath}",
                    _templatePath
                );
                _logger.LogWarning("Tentative de création du dossier...");
                try
                {
                    Directory.CreateDirectory(_templatePath);
                    _logger.LogInformation("Dossier créé avec succès");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Impossible de créer le dossier de templates");
                }
            }
            else
            {
                // Lister les templates disponibles
                var availableTemplates = Directory
                    .GetFiles(_templatePath, "*.html")
                    .Select(f => Path.GetFileName(f))
                    .ToList();
                _logger.LogInformation(
                    "Templates disponibles: {Templates}",
                    string.Join(", ", availableTemplates)
                );
            }
        }

        public async Task<string> RenderTemplateAsync(
            string templateName,
            Dictionary<string, string> parameters
        )
        {
            // Nettoyer le nom du template (enlever .html si déjà présent)
            var cleanTemplateName = templateName.Replace(".html", "");
            var templateFile = Path.Combine(_templatePath, $"{cleanTemplateName}.html");

            _logger.LogInformation(
                "Recherche du template: {TemplateName} dans {TemplatePath}",
                cleanTemplateName,
                _templatePath
            );
            _logger.LogInformation("Chemin complet du fichier: {TemplateFile}", templateFile);

            if (!File.Exists(templateFile))
            {
                _logger.LogError("Template non trouvé: {TemplateFile}", templateFile);

                // Lister les fichiers disponibles pour aider au diagnostic
                if (Directory.Exists(_templatePath))
                {
                    var availableFiles = Directory.GetFiles(_templatePath, "*.html");
                    _logger.LogError(
                        "Fichiers disponibles dans le dossier: {Files}",
                        string.Join(", ", availableFiles.Select(f => Path.GetFileName(f)))
                    );
                }

                throw new FileNotFoundException(
                    $"Template '{cleanTemplateName}.html' non trouvé dans {_templatePath}",
                    templateFile
                );
            }

            _logger.LogInformation("Template trouvé, lecture en cours...");
            var template = await File.ReadAllTextAsync(templateFile);

            _logger.LogInformation("Remplacement des paramètres dans le template");
            _logger.LogDebug(
                "Paramètres reçus: {Parameters}",
                string.Join(", ", parameters.Select(p => $"{p.Key}={p.Value}"))
            );

            // Remplacer les paramètres {{key}} par leurs valeurs
            foreach (var param in parameters)
            {
                var placeholder = $"{{{{{param.Key}}}}}";
                if (template.Contains(placeholder))
                {
                    template = template.Replace(placeholder, param.Value ?? string.Empty);
                    _logger.LogDebug("Paramètre remplacé: {Key} = {Value}", param.Key, param.Value);
                }
                else
                {
                    _logger.LogWarning(
                        "Placeholder {Placeholder} non trouvé dans le template",
                        placeholder
                    );
                }
            }

            // Vérifier s'il reste des placeholders non remplacés
            var remainingPlaceholders = System
                .Text.RegularExpressions.Regex.Matches(template, @"\{\{(\w+)\}\}")
                .Select(m => m.Value)
                .Distinct()
                .ToList();

            if (remainingPlaceholders.Any())
            {
                _logger.LogWarning(
                    "Placeholders non remplacés dans le template: {Placeholders}",
                    string.Join(", ", remainingPlaceholders)
                );
            }

            _logger.LogInformation("Template rendu avec succès");
            return template;
        }

        public string GetTemplateSubject(string templateName, Dictionary<string, string> parameters)
        {
            // Nettoyer le nom du template
            var cleanTemplateName = templateName.Replace(".html", "");

            var subject = cleanTemplateName switch
            {
                "plannification_budget" =>
                    $"Nouvelle Plannification - {parameters.GetValueOrDefault("projet", "Budget")}",
                "plannification_budget_valider" =>
                    $"Plannification Validée - {parameters.GetValueOrDefault("projet", "Budget")}",
                "realisation_budget" =>
                    $"Réalisation en cours - {parameters.GetValueOrDefault("projet", "Budget")}",
                "realisation_budget_valider" =>
                    $"Réalisation Validée - {parameters.GetValueOrDefault("projet", "Budget")}",
                _ => "Notification Budget",
            };

            _logger.LogInformation("Sujet de l'email: {Subject}", subject);
            return subject;
        }
    }
}

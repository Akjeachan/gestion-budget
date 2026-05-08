using GESTIONBUDGETAPI.Module;
using GESTIONBUDGETAPI.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace GESTIONBUDGETAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailDiagnosticController : ControllerBase
    {
        private readonly IOptions<EmailSettings> _emailSettings;
        private readonly ILogger<EmailDiagnosticController> _logger;
        private readonly ITemplateService _templateService;
        private readonly IWebHostEnvironment _environment;

        public EmailDiagnosticController(
            IOptions<EmailSettings> emailSettings,
            ILogger<EmailDiagnosticController> logger,
            ITemplateService templateService,
            IWebHostEnvironment environment
        )
        {
            _emailSettings = emailSettings;
            _logger = logger;
            _templateService = templateService;
            _environment = environment;
        }

        [HttpGet("config")]
        public IActionResult GetConfig()
        {
            var settings = _emailSettings.Value;

            // Validation flexible du mot de passe
            string passwordMessage;
            if (string.IsNullOrEmpty(settings.Password))
            {
                passwordMessage = "❌ Aucun mot de passe configuré";
            }
            else if (settings.Password.Length < 8)
            {
                passwordMessage = "⚠️ Mot de passe trop court (< 8 caractères)";
            }
            else
            {
                passwordMessage =
                    $"✅ Mot de passe configuré ({settings.Password.Length} caractères)";
            }

            return Ok(
                new
                {
                    SmtpServer = settings.SmtpServer,
                    SmtpPort = settings.SmtpPort,
                    SenderEmail = settings.SenderEmail,
                    Username = settings.Username,
                    HasPassword = !string.IsNullOrEmpty(settings.Password),
                    PasswordLength = settings.Password?.Length ?? 0,
                    UseSsl = settings.UseSsl,
                    Message = passwordMessage,
                    Info = new
                    {
                        GmailStandard = "Les mots de passe d'application Gmail font généralement 16 caractères",
                        WorkspaceVariation = "Les comptes Google Workspace peuvent avoir des longueurs différentes",
                        CurrentStatus = settings.Password?.Length >= 8
                            ? "Configuration acceptable"
                            : "Vérifier le mot de passe",
                    },
                }
            );
        }

        [HttpPost("test-connection")]
        public async Task<IActionResult> TestConnection()
        {
            var settings = _emailSettings.Value;
            var steps = new List<string>();
            var diagnosticInfo = new Dictionary<string, object>();

            // Validation préliminaire
            if (string.IsNullOrEmpty(settings.SmtpServer))
            {
                return BadRequest(new { error = "SmtpServer n'est pas configuré" });
            }

            if (string.IsNullOrEmpty(settings.Username))
            {
                return BadRequest(new { error = "Username n'est pas configuré" });
            }

            if (string.IsNullOrEmpty(settings.Password))
            {
                return BadRequest(new { error = "Password n'est pas configuré" });
            }

            try
            {
                using var client = new SmtpClient();

                // Activer les logs détaillés de MailKit (optionnel)
                // client.ServerCertificateValidationCallback = (s, c, h, e) => true;

                // Étape 1 : Connexion
                steps.Add($"🔌 Connexion à {settings.SmtpServer}:{settings.SmtpPort}...");
                _logger.LogInformation(
                    "Tentative de connexion à {Server}:{Port} avec SSL={UseSsl}",
                    settings.SmtpServer,
                    settings.SmtpPort,
                    settings.UseSsl
                );

                await client.ConnectAsync(
                    settings.SmtpServer,
                    settings.SmtpPort,
                    settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None
                );

                steps.Add($"✅ Connexion établie avec {settings.SmtpServer}");
                diagnosticInfo["connectionSuccess"] = true;

                // Étape 2 : Authentification
                steps.Add($"🔐 Authentification avec {settings.Username}...");
                _logger.LogInformation(
                    "Tentative d'authentification avec {Username} (password length: {Length})",
                    settings.Username,
                    settings.Password.Length
                );

                await client.AuthenticateAsync(settings.Username, settings.Password);

                steps.Add($"✅ Authentification réussie");
                diagnosticInfo["authenticationSuccess"] = true;

                // Étape 3 : Vérifier les capacités
                steps.Add($"📋 Capacités du serveur : {string.Join(", ", client.Capabilities)}");
                diagnosticInfo["serverCapabilities"] = client.Capabilities.ToString();

                // Étape 4 : Déconnexion
                await client.DisconnectAsync(true);
                steps.Add("✅ Déconnexion réussie");

                return Ok(
                    new
                    {
                        success = true,
                        message = "🎉 Tous les tests ont réussi ! La configuration email est correcte.",
                        steps,
                        config = new
                        {
                            server = settings.SmtpServer,
                            port = settings.SmtpPort,
                            username = settings.Username,
                            passwordLength = settings.Password.Length,
                            useSsl = settings.UseSsl,
                        },
                        diagnosticInfo,
                        nextStep = "Vous pouvez maintenant envoyer des emails !",
                    }
                );
            }
            catch (MailKit.Security.AuthenticationException authEx)
            {
                steps.Add($"❌ Erreur d'authentification : {authEx.Message}");

                _logger.LogError(authEx, "Échec de l'authentification");

                return BadRequest(
                    new
                    {
                        success = false,
                        error = "Authentification échouée",
                        message = authEx.Message,
                        steps,
                        suggestions = new[]
                        {
                            "Vérifiez que votre nom d'utilisateur est correct : "
                                + settings.Username,
                            $"Vérifiez que votre mot de passe est correct (longueur actuelle : {settings.Password.Length} caractères)",
                            "Pour Gmail personnel : Utilisez un mot de passe d'application depuis https://myaccount.google.com/apppasswords",
                            "Pour Google Workspace : Contactez votre administrateur IT",
                            "Vérifiez que la validation en 2 étapes est activée (pour Gmail)",
                            "Essayez de régénérer un nouveau mot de passe d'application",
                        },
                    }
                );
            }
            catch (MailKit.Net.Smtp.SmtpCommandException smtpEx)
            {
                steps.Add($"❌ Erreur SMTP : {smtpEx.Message}");

                _logger.LogError(smtpEx, "Erreur de commande SMTP");

                return BadRequest(
                    new
                    {
                        success = false,
                        error = "Erreur SMTP",
                        message = smtpEx.Message,
                        statusCode = smtpEx.StatusCode,
                        steps,
                        suggestions = new[]
                        {
                            "Vérifiez les paramètres du serveur SMTP",
                            "Le serveur SMTP peut bloquer votre connexion",
                            "Vérifiez votre connexion Internet",
                        },
                    }
                );
            }
            catch (Exception ex)
            {
                steps.Add($"❌ Erreur inattendue : {ex.GetType().Name} - {ex.Message}");

                _logger.LogError(ex, "Erreur lors du test de connexion");

                return BadRequest(
                    new
                    {
                        success = false,
                        error = ex.GetType().Name,
                        message = ex.Message,
                        steps,
                        fullError = ex.ToString(),
                    }
                );
            }
        }

        [HttpPost("test-send")]
        public async Task<IActionResult> TestSendEmail([FromQuery] string to)
        {
            if (string.IsNullOrEmpty(to))
            {
                return BadRequest(
                    new
                    {
                        error = "Veuillez fournir une adresse email destinataire (?to=email@example.com)",
                    }
                );
            }

            var settings = _emailSettings.Value;
            var steps = new List<string>();

            try
            {
                using var client = new SmtpClient();

                // Connexion
                steps.Add("🔌 Connexion au serveur...");
                await client.ConnectAsync(
                    settings.SmtpServer,
                    settings.SmtpPort,
                    settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None
                );
                steps.Add("✅ Connecté");

                // Authentification
                steps.Add("🔐 Authentification...");
                await client.AuthenticateAsync(settings.Username, settings.Password);
                steps.Add("✅ Authentifié");

                // Créer le message
                steps.Add("📧 Création du message de test...");
                var message = new MimeKit.MimeMessage();
                message.From.Add(
                    new MimeKit.MailboxAddress(settings.SenderName, settings.SenderEmail)
                );
                message.To.Add(MimeKit.MailboxAddress.Parse(to));
                message.Subject = "Test d'envoi - GestionBudgetAPI";

                var builder = new MimeKit.BodyBuilder
                {
                    HtmlBody =
                        @"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #4CAF50;'>✅ Test d'envoi réussi !</h2>
                            <p>Cet email confirme que votre configuration SMTP fonctionne correctement.</p>
                            <hr>
                            <p style='color: #666; font-size: 12px;'>
                                Envoyé depuis GestionBudgetAPI<br>
                                Date : "
                        + DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")
                        + @"
                            </p>
                        </body>
                        </html>",
                };

                message.Body = builder.ToMessageBody();
                steps.Add("✅ Message créé");

                // Envoi
                steps.Add($"📤 Envoi vers {to}...");
                await client.SendAsync(message);
                steps.Add("✅ Email envoyé avec succès !");

                // Déconnexion
                await client.DisconnectAsync(true);
                steps.Add("✅ Déconnecté");

                return Ok(
                    new
                    {
                        success = true,
                        message = $"Email envoyé avec succès à {to}",
                        steps,
                        info = "Vérifiez votre boîte de réception (et le dossier spam)",
                    }
                );
            }
            catch (Exception ex)
            {
                steps.Add($"❌ Erreur : {ex.Message}");

                _logger.LogError(ex, "Erreur lors de l'envoi de l'email");

                return BadRequest(
                    new
                    {
                        success = false,
                        error = ex.GetType().Name,
                        message = ex.Message,
                        steps,
                    }
                );
            }
        }

        [HttpGet("templates")]
        public IActionResult GetTemplates()
        {
            var templatesPath = Path.Combine(_environment.ContentRootPath, "Templates", "Email");

            try
            {
                var templatesList = Directory.Exists(templatesPath)
                    ? Directory
                        .GetFiles(templatesPath, "*.html")
                        .Select(f => new
                        {
                            name = Path.GetFileName(f),
                            fullPath = f,
                            size = new FileInfo(f).Length,
                            lastModified = new FileInfo(f).LastWriteTime.ToString(
                                "dd/MM/yyyy HH:mm:ss"
                            ),
                        })
                        .ToList()
                    : null;

                var result = new
                {
                    contentRootPath = _environment.ContentRootPath,
                    templatesPath = templatesPath,
                    templatesPathExists = Directory.Exists(templatesPath),
                    templates = templatesList,
                    expectedTemplates = new[]
                    {
                        "plannification_budget.html",
                        "plannification_budget_valider.html",
                        "realisation_budget.html",
                        "realisation_budget_valider.html",
                    },
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des templates");
                return BadRequest(
                    new
                    {
                        error = ex.Message,
                        contentRootPath = _environment.ContentRootPath,
                        templatesPath = templatesPath,
                    }
                );
            }
        }

        [HttpPost("test-template")]
        public async Task<IActionResult> TestTemplate([FromBody] TestTemplateRequest request)
        {
            if (string.IsNullOrEmpty(request.TemplateName))
            {
                return BadRequest(new { error = "TemplateName est requis" });
            }

            try
            {
                // Préparer les paramètres de test
                var testParameters =
                    request.Parameters
                    ?? new Dictionary<string, string>
                    {
                        { "userName", "Test User" },
                        { "departement", "Test Department" },
                        { "date", DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss") },
                        { "projet", "Projet Test" },
                        { "montant", "1,000,000" },
                        {
                            "description",
                            "Ceci est une description de test pour vérifier le rendu du template."
                        },
                        { "validateur", "Admin Test" },
                    };

                _logger.LogInformation("Test du template: {TemplateName}", request.TemplateName);

                // Rendre le template
                var renderedHtml = await _templateService.RenderTemplateAsync(
                    request.TemplateName,
                    testParameters
                );
                var subject = _templateService.GetTemplateSubject(
                    request.TemplateName,
                    testParameters
                );

                return Ok(
                    new
                    {
                        success = true,
                        templateName = request.TemplateName,
                        subject = subject,
                        renderedHtml = renderedHtml,
                        parametersUsed = testParameters,
                        message = "Template rendu avec succès",
                    }
                );
            }
            catch (FileNotFoundException fnfEx)
            {
                _logger.LogError(fnfEx, "Template non trouvé");
                return NotFound(
                    new
                    {
                        success = false,
                        error = "Template non trouvé",
                        message = fnfEx.Message,
                        suggestion = "Utilisez GET /api/EmailDiagnostic/templates pour voir les templates disponibles",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du test du template");
                return BadRequest(
                    new
                    {
                        success = false,
                        error = ex.GetType().Name,
                        message = ex.Message,
                    }
                );
            }
        }

        [HttpPost("test-template-and-send")]
        public async Task<IActionResult> TestTemplateAndSend(
            [FromBody] TestTemplateAndSendRequest request
        )
        {
            if (string.IsNullOrEmpty(request.TemplateName))
            {
                return BadRequest(new { error = "TemplateName est requis" });
            }

            if (string.IsNullOrEmpty(request.ToEmail))
            {
                return BadRequest(new { error = "ToEmail est requis" });
            }

            var settings = _emailSettings.Value;
            var steps = new List<string>();

            try
            {
                // Préparer les paramètres de test
                var testParameters =
                    request.Parameters
                    ?? new Dictionary<string, string>
                    {
                        { "userName", "Test User" },
                        { "departement", "Test Department" },
                        { "date", DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss") },
                        { "projet", "Projet Test" },
                        { "montant", "1,000,000" },
                        {
                            "description",
                            "Ceci est un email de test envoyé depuis le système de diagnostic."
                        },
                        { "validateur", "Admin Test" },
                    };

                steps.Add($"📋 Rendu du template: {request.TemplateName}");
                var renderedHtml = await _templateService.RenderTemplateAsync(
                    request.TemplateName,
                    testParameters
                );
                var subject = _templateService.GetTemplateSubject(
                    request.TemplateName,
                    testParameters
                );
                steps.Add("✅ Template rendu avec succès");

                // Connexion et envoi
                using var client = new SmtpClient();

                steps.Add("🔌 Connexion au serveur SMTP...");
                await client.ConnectAsync(
                    settings.SmtpServer,
                    settings.SmtpPort,
                    settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None
                );
                steps.Add("✅ Connecté");

                steps.Add("🔐 Authentification...");
                await client.AuthenticateAsync(settings.Username, settings.Password);
                steps.Add("✅ Authentifié");

                steps.Add("📧 Création du message...");
                var message = new MimeKit.MimeMessage();
                message.From.Add(
                    new MimeKit.MailboxAddress(settings.SenderName, settings.SenderEmail)
                );
                message.To.Add(MimeKit.MailboxAddress.Parse(request.ToEmail));
                message.Subject = subject;

                var builder = new MimeKit.BodyBuilder { HtmlBody = renderedHtml };

                message.Body = builder.ToMessageBody();
                steps.Add("✅ Message créé");

                steps.Add($"📤 Envoi vers {request.ToEmail}...");
                await client.SendAsync(message);
                steps.Add("✅ Email envoyé avec succès !");

                await client.DisconnectAsync(true);
                steps.Add("✅ Déconnecté");

                return Ok(
                    new
                    {
                        success = true,
                        message = $"Email de test avec template envoyé à {request.ToEmail}",
                        templateName = request.TemplateName,
                        subject = subject,
                        steps,
                        parametersUsed = testParameters,
                    }
                );
            }
            catch (FileNotFoundException fnfEx)
            {
                steps.Add($"❌ Template non trouvé : {fnfEx.Message}");
                return NotFound(
                    new
                    {
                        success = false,
                        error = "Template non trouvé",
                        message = fnfEx.Message,
                        steps,
                    }
                );
            }
            catch (Exception ex)
            {
                steps.Add($"❌ Erreur : {ex.Message}");
                _logger.LogError(ex, "Erreur lors du test d'envoi du template");

                return BadRequest(
                    new
                    {
                        success = false,
                        error = ex.GetType().Name,
                        message = ex.Message,
                        steps,
                    }
                );
            }
        }
    }

    public class TestTemplateRequest
    {
        public string TemplateName { get; set; } = string.Empty;
        public Dictionary<string, string>? Parameters { get; set; }
    }

    public class TestTemplateAndSendRequest
    {
        public string TemplateName { get; set; } = string.Empty;
        public string ToEmail { get; set; } = string.Empty;
        public Dictionary<string, string>? Parameters { get; set; }
    }
}

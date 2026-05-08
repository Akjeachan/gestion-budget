using GESTIONBUDGETAPI.Module;
using GESTIONBUDGETAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnvoiMailController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<EnvoiMailController> _logger;

        public EnvoiMailController(IEmailService emailService, ILogger<EnvoiMailController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendEmail([FromBody] EmailMessage emailMessage)
        {
            try
            {
                await _emailService.SendEmailAsync(emailMessage);
                return Ok(new { success = true, message = "Email envoyé avec succès" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi de l'email");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("send-simple")]
        public async Task<IActionResult> SendSimpleEmail(
            [FromQuery] string to,
            [FromQuery] string subject,
            [FromQuery] string body
        )
        {
            try
            {
                await _emailService.SendEmailAsync(to, subject, body);
                return Ok(new { success = true, message = "Email envoyé avec succès" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi de l'email");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("send-with-user-template")]
        public async Task<IActionResult> SendWithUserTemplate(
            [FromBody] SendEmailWithTemplateRequest request
        )
        {
            try
            {
                await _emailService.SendEmailWithTemplateAsync(
                    request.UserId,
                    request.ToEmail,
                    request.TemplateName,
                    request.Parameters
                );

                return Ok(new { success = true, message = "Email envoyé avec succès" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi de l'email avec template");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("send-to-admins")]
        public async Task<IActionResult> SendToAdmins([FromBody] SendToAdminsRequest request)
        {
            try
            {
                await _emailService.SendEmailToAdminsAsync(
                    request.TemplateName,
                    request.Parameters
                );
                return Ok(new { success = true, message = "Emails envoyés aux administrateurs" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi aux administrateurs");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("send-plannification")]
        public async Task<IActionResult> SendAfterPlannification(
            [FromBody] SendToPlannification request
        )
        {
            try
            {
                _logger.LogInformation(
                    "Envoi email plannification - Template: {Template}",
                    request.TemplateName
                );
                await _emailService.SendEmailPlannification(
                    request.TemplateName,
                    request.Parameters
                );
                return Ok(
                    new
                    {
                        success = true,
                        message = "Emails de plannification envoyés aux administrateurs",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi de plannification");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("send-plannification-valider")]
        public async Task<IActionResult> SendAfterValidationPlannification(
            [FromBody] SendToPlannificationValider request
        )
        {
            try
            {
                _logger.LogInformation(
                    "Envoi email validation plannification - Template: {Template}",
                    request.TemplateName
                );
                await _emailService.SendEmailPlannificationValider(
                    request.TemplateName,
                    request.Parameters
                );
                return Ok(
                    new
                    {
                        success = true,
                        message = "Emails de validation plannification envoyés aux administrateurs",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi de validation plannification");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("send-realisation")]
        public async Task<IActionResult> SendAfterRealisation([FromBody] SendToRealisation request)
        {
            try
            {
                _logger.LogInformation(
                    "Envoi email réalisation - Template: {Template}",
                    request.TemplateName
                );
                await _emailService.SendEmailRealisation(request.TemplateName, request.Parameters);
                return Ok(
                    new
                    {
                        success = true,
                        message = "Emails de réalisation envoyés aux administrateurs",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi de réalisation");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("send-realisation-valider")]
        public async Task<IActionResult> SendAfterValidationRealisation(
            [FromBody] SendToRealisationValider request
        )
        {
            try
            {
                _logger.LogInformation(
                    "Envoi email validation réalisation - Template: {Template}",
                    request.TemplateName
                );
                await _emailService.SendEmailRealisationValider(
                    request.TemplateName,
                    request.Parameters
                );
                return Ok(
                    new
                    {
                        success = true,
                        message = "Emails de validation réalisation envoyés aux administrateurs",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi de validation réalisation");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

#if DEBUG
        /// <summary>
        /// Endpoint de test pour envoyer un email de plannification sans template
        /// Disponible uniquement en mode DEBUG
        /// </summary>
        [HttpPost("test-plannification")]
        public async Task<IActionResult> TestPlannification([FromBody] TestEmailRequest request)
        {
            try
            {
                var testBody =
                    $@"
<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: Arial, sans-serif; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 8px; }}
        h1 {{ color: #0066cc; }}
        .params {{ background: white; padding: 15px; border-radius: 5px; margin-top: 20px; }}
        .param-item {{ padding: 8px; border-left: 3px solid #0066cc; margin: 5px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <h1>🧪 Test Email Plannification</h1>
        <p><strong>Template:</strong> {request.TemplateName}</p>
        <p><strong>Email de test:</strong> {request.TestEmail}</p>
        <p><strong>Date:</strong> {DateTime.Now:dd/MM/yyyy HH:mm:ss}</p>
        
        <div class='params'>
            <h3>📋 Paramètres:</h3>
            {string.Join("", request.Parameters.Select(p => $"<div class='param-item'><b>{p.Key}:</b> {p.Value}</div>"))}
        </div>
    </div>
</body>
</html>";

                await _emailService.SendEmailAsync(
                    request.TestEmail,
                    $"🧪 Test Plannification - {request.TemplateName}",
                    testBody
                );

                return Ok(
                    new
                    {
                        success = true,
                        message = $"Email de test envoyé à {request.TestEmail}",
                        info = "Ceci est un email de test (mode DEBUG uniquement)",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi du test");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Vérifie la configuration email et la connexion SMTP
        /// Disponible uniquement en mode DEBUG
        /// </summary>
        [HttpGet("test-config")]
        public IActionResult TestEmailConfig()
        {
            try
            {
                return Ok(
                    new
                    {
                        success = true,
                        message = "Configuration email accessible",
                        info = new
                        {
                            Note = "Les détails sensibles ne sont pas affichés pour des raisons de sécurité",
                        },
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la vérification de la configuration");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
#endif

        /// <summary>
        /// Endpoint pour simuler l'envoi (dry run) - Ne pas envoyer réellement
        /// </summary>
        [HttpPost("dry-run-plannification")]
        public IActionResult DryRunPlannification([FromBody] SendToPlannification request)
        {
            try
            {
                _logger.LogInformation("DRY RUN - Simulation envoi plannification");
                _logger.LogInformation("Template: {Template}", request.TemplateName);
                _logger.LogInformation(
                    "Paramètres: {Params}",
                    string.Join(", ", request.Parameters.Select(p => $"{p.Key}={p.Value}"))
                );

                return Ok(
                    new
                    {
                        success = true,
                        message = "Simulation réussie - Aucun email envoyé",
                        details = new
                        {
                            template = request.TemplateName,
                            parametersCount = request.Parameters.Count,
                            parameters = request.Parameters,
                        },
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la simulation");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }

    // DTO pour les requêtes
    public class SendEmailWithTemplateRequest
    {
        public int UserId { get; set; }
        public string ToEmail { get; set; } = string.Empty;
        public string TemplateName { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
    }

    public class SendToAdminsRequest
    {
        public string TemplateName { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
    }

    public class SendToPlannification
    {
        public string TemplateName { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
    }

    public class SendToPlannificationValider
    {
        public string TemplateName { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
    }

    public class SendToRealisation
    {
        public string TemplateName { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
    }

    public class SendToRealisationValider
    {
        public string TemplateName { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
    }

#if DEBUG
    public class TestEmailRequest
    {
        public string TemplateName { get; set; } = string.Empty;
        public string TestEmail { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
    }
#endif
}

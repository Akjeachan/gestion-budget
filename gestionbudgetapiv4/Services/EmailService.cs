using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MimeKit;

namespace GESTIONBUDGETAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;
        private readonly ApplicationDbContext _context;
        private readonly ITemplateService _templateService;
        private readonly BudgetContext _budgetcontext;

        public EmailService(
            IOptions<EmailSettings> emailSettings,
            ILogger<EmailService> logger,
            ApplicationDbContext context,
            ITemplateService templateService,
            BudgetContext budgetContext
        )
        {
            _emailSettings =
                emailSettings?.Value ?? throw new ArgumentNullException(nameof(emailSettings));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _templateService =
                templateService ?? throw new ArgumentNullException(nameof(templateService));
            _budgetcontext =
                budgetContext ?? throw new ArgumentNullException(nameof(budgetContext));
        }

        public async Task SendEmailAsync(EmailMessage emailMessage)
        {
            if (emailMessage == null)
                throw new ArgumentNullException(nameof(emailMessage));

            var message = CreateMimeMessage(emailMessage);
            await SendMessageAsync(message, _emailSettings);
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            if (string.IsNullOrWhiteSpace(to))
                throw new ArgumentException(
                    "L'adresse email destinataire ne peut pas être vide",
                    nameof(to)
                );

            if (string.IsNullOrWhiteSpace(subject))
                throw new ArgumentException("Le sujet ne peut pas être vide", nameof(subject));

            var emailMessage = new EmailMessage
            {
                To = to,
                Subject = subject,
                Body = body ?? string.Empty,
                IsHtml = isHtml,
            };

            await SendEmailAsync(emailMessage);
        }

        public async Task SendEmailWithTemplateAsync(
            int userId,
            string toEmail,
            string templateName,
            Dictionary<string, string> parameters
        )
        {
            if (string.IsNullOrWhiteSpace(toEmail))
                throw new ArgumentException(
                    "L'adresse email destinataire ne peut pas être vide",
                    nameof(toEmail)
                );

            if (string.IsNullOrWhiteSpace(templateName))
                throw new ArgumentException(
                    "Le nom du template ne peut pas être vide",
                    nameof(templateName)
                );

            if (parameters == null)
                throw new ArgumentNullException(nameof(parameters));

            // Récupérer l'utilisateur
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException($"Utilisateur avec l'ID {userId} introuvable");
            }

            // Rendre le template avec gestion d'erreur
            string renderedBody;
            string subject;

            try
            {
                renderedBody = await _templateService.RenderTemplateAsync(templateName, parameters);
                subject = _templateService.GetTemplateSubject(templateName, parameters);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Template {TemplateName} introuvable, utilisation du template par défaut",
                    templateName
                );
                renderedBody = GenerateDefaultTemplate(templateName, parameters);
                subject = $"Notification - {templateName}";
            }

            // Créer les paramètres SMTP de l'utilisateur avec vérifications null
            var userSmtpSettings = new EmailSettings
            {
                SenderName = user.user_name ?? _emailSettings.SenderName,
                SenderEmail = user.user_identifiant ?? _emailSettings.SenderEmail,
                Username = user.user_name ?? user.user_identifiant ?? _emailSettings.Username,
                Password = user.user_password ?? _emailSettings.Password,
                SmtpServer = _emailSettings.SmtpServer,
                SmtpPort = _emailSettings.SmtpPort,
                UseSsl = _emailSettings.UseSsl,
            };

            // Créer et envoyer l'email
            var emailMessage = new EmailMessage
            {
                To = toEmail,
                Subject = subject,
                Body = renderedBody,
                IsHtml = true,
            };

            var message = CreateMimeMessage(emailMessage, userSmtpSettings);
            await SendMessageAsync(message, userSmtpSettings);
        }

        public async Task SendEmailToAdminsAsync(
            string templateName,
            Dictionary<string, string> parameters
        )
        {
            if (string.IsNullOrWhiteSpace(templateName))
                throw new ArgumentException(
                    "Le nom du template ne peut pas être vide",
                    nameof(templateName)
                );

            if (parameters == null)
                throw new ArgumentNullException(nameof(parameters));

            // Récupérer le département Direction
            var departement = await _budgetcontext.Departements.FirstOrDefaultAsync(d =>
                d.dept_name == "Direction"
            );

            if (departement == null)
            {
                throw new InvalidOperationException("Département 'Direction' introuvable");
            }

            // Récupérer tous les admins
            var admins = await _context
                .Users.Where(u => u.user_Departementid == departement.dept_id)
                .ToListAsync();

            if (!admins.Any())
            {
                throw new InvalidOperationException(
                    "Aucun administrateur trouvé dans le département Direction"
                );
            }

            // Rendre le template avec gestion d'erreur
            string renderedBody;
            string subject;

            try
            {
                renderedBody = await _templateService.RenderTemplateAsync(templateName, parameters);
                subject = _templateService.GetTemplateSubject(templateName, parameters);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Template {TemplateName} introuvable, utilisation du template par défaut",
                    templateName
                );
                renderedBody = GenerateDefaultTemplate(templateName, parameters);
                subject = $"Notification - {templateName}";
            }

            // Envoyer à chaque admin
            foreach (var admin in admins)
            {
                // Vérifier que l'admin a un email valide
                if (string.IsNullOrWhiteSpace(admin.user_identifiant))
                {
                    _logger.LogWarning(
                        "Admin avec ID {UserId} n'a pas d'email configuré, email ignoré",
                        admin.user_id
                    );
                    continue;
                }

                try
                {
                    var emailMessage = new EmailMessage
                    {
                        To = admin.user_identifiant,
                        Subject = subject,
                        Body = renderedBody,
                        IsHtml = true,
                    };

                    await SendEmailAsync(emailMessage);
                    _logger.LogInformation(
                        "Email envoyé avec succès à l'admin {Email}",
                        admin.user_identifiant
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Erreur lors de l'envoi de l'email à l'admin {Email}",
                        admin.user_identifiant
                    );
                    // Continue avec les autres admins même en cas d'erreur
                }
            }
        }

        public async Task SendEmailPlannification(
            string templateName,
            Dictionary<string, string> parameters
        )
        {
            await SendEmailToAdminsWithTemplate(templateName, parameters, "Plannification");
        }

        public async Task SendEmailPlannificationValider(
            string templateName,
            Dictionary<string, string> parameters
        )
        {
            await SendEmailToAdminsWithTemplate(
                templateName,
                parameters,
                "Validation Plannification"
            );
        }

        public async Task SendEmailRealisation(
            string templateName,
            Dictionary<string, string> parameters
        )
        {
            await SendEmailToAdminsWithTemplate(templateName, parameters, "Réalisation");
        }

        public async Task SendEmailRealisationValider(
            string templateName,
            Dictionary<string, string> parameters
        )
        {
            await SendEmailToAdminsWithTemplate(templateName, parameters, "Validation Réalisation");
        }

        // Méthode privée réutilisable pour éviter la duplication de code
        private async Task SendEmailToAdminsWithTemplate(
            string templateName,
            Dictionary<string, string> parameters,
            string emailType
        )
        {
            if (string.IsNullOrWhiteSpace(templateName))
                throw new ArgumentException(
                    "Le nom du template ne peut pas être vide",
                    nameof(templateName)
                );

            if (parameters == null)
                throw new ArgumentNullException(nameof(parameters));

            // Récupérer le département Direction
            var departement = await _budgetcontext.Departements.FirstOrDefaultAsync(d =>
                d.dept_name == "Direction"
            );

            if (departement == null)
            {
                throw new InvalidOperationException("Département 'Direction' introuvable");
            }

            // Récupérer tous les admins
            var admins = await _context
                .Users.Where(u => u.user_Departementid == departement.dept_id)
                .ToListAsync();

            if (!admins.Any())
            {
                throw new InvalidOperationException(
                    "Aucun administrateur trouvé dans le département Direction"
                );
            }

            // Rendre le template avec gestion d'erreur
            string renderedBody;
            string subject;

            try
            {
                renderedBody = await _templateService.RenderTemplateAsync(templateName, parameters);
                subject = _templateService.GetTemplateSubject(templateName, parameters);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Template {TemplateName} introuvable, utilisation du template par défaut",
                    templateName
                );
                renderedBody = GenerateDefaultTemplate(templateName, parameters, emailType);
                subject = $"Notification {emailType} - {DateTime.Now:dd/MM/yyyy}";
            }

            // Envoyer à chaque admin
            int successCount = 0;
            int failureCount = 0;

            foreach (var admin in admins)
            {
                // Vérifier que l'admin a un email valide
                if (string.IsNullOrWhiteSpace(admin.user_identifiant))
                {
                    _logger.LogWarning(
                        "Admin avec ID {UserId} n'a pas d'email configuré, email ignoré",
                        admin.user_id
                    );
                    failureCount++;
                    continue;
                }

                try
                {
                    var emailMessage = new EmailMessage
                    {
                        To = admin.user_identifiant,
                        Subject = subject,
                        Body = renderedBody,
                        IsHtml = true,
                    };

                    await SendEmailAsync(emailMessage);
                    _logger.LogInformation(
                        "Email {EmailType} envoyé avec succès à l'admin {Email}",
                        emailType,
                        admin.user_identifiant
                    );
                    successCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Erreur lors de l'envoi de l'email {EmailType} à l'admin {Email}",
                        emailType,
                        admin.user_identifiant
                    );
                    failureCount++;
                }
            }

            _logger.LogInformation(
                "Envoi {EmailType} terminé: {Success} réussi(s), {Failure} échec(s)",
                emailType,
                successCount,
                failureCount
            );
        }

        // Méthode pour générer un template HTML par défaut
        private string GenerateDefaultTemplate(
            string templateName,
            Dictionary<string, string> parameters,
            string emailType = ""
        )
        {
            var typeSection = !string.IsNullOrEmpty(emailType)
                ? $"<p><strong>Type:</strong> {emailType}</p>"
                : "";

            var html =
                $@"
<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Notification - {templateName}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            background-color: #f4f4f4;
            border-radius: 5px;
            padding: 20px;
        }}
        h1 {{
            color: #0066cc;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 10px;
        }}
        .info {{
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }}
        .param {{
            padding: 8px;
            border-left: 3px solid #0066cc;
            margin: 5px 0;
        }}
        .param-key {{
            font-weight: bold;
            color: #0066cc;
        }}
        .footer {{
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            font-size: 0.9em;
            color: #666;
        }}
        .warning {{
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <h1>📧 Notification Système</h1>
        
        <div class='warning'>
            ⚠️ Ceci est un email généré automatiquement car le template '{templateName}' n'a pas été trouvé.
        </div>

        <div class='info'>
            <p><strong>Template demandé:</strong> {templateName}</p>
            {typeSection}
            <p><strong>Date:</strong> {DateTime.Now:dd/MM/yyyy HH:mm:ss}</p>
        </div>

        <h2>📋 Paramètres reçus:</h2>
        <div class='info'>";

            foreach (var param in parameters)
            {
                html +=
                    $@"
            <div class='param'>
                <span class='param-key'>{param.Key}:</span> {param.Value}
            </div>";
            }

            html +=
                $@"
        </div>

        <div class='footer'>
            <p>Cet email a été généré automatiquement par le système de gestion de budget.</p>
            <p>Pour configurer un template personnalisé, veuillez créer le fichier: <code>{templateName}.html</code></p>
        </div>
    </div>
</body>
</html>";

            return html;
        }

        private MimeMessage CreateMimeMessage(
            EmailMessage emailMessage,
            EmailSettings? settings = null
        )
        {
            if (emailMessage == null)
                throw new ArgumentNullException(nameof(emailMessage));

            var smtpSettings = settings ?? _emailSettings;
            var message = new MimeMessage();

            // Expéditeur avec vérifications
            var senderName = smtpSettings.SenderName ?? "Application";
            var senderEmail =
                smtpSettings.SenderEmail
                ?? throw new InvalidOperationException("SenderEmail n'est pas configuré");

            message.From.Add(new MailboxAddress(senderName, senderEmail));

            // Destinataire avec vérification
            if (string.IsNullOrWhiteSpace(emailMessage.To))
                throw new ArgumentException("L'adresse email destinataire ne peut pas être vide");

            message.To.Add(MailboxAddress.Parse(emailMessage.To));

            // CC (Copie carbone) avec vérifications
            if (emailMessage.Cc != null && emailMessage.Cc.Any())
            {
                foreach (var cc in emailMessage.Cc)
                {
                    if (!string.IsNullOrWhiteSpace(cc))
                    {
                        try
                        {
                            message.Cc.Add(MailboxAddress.Parse(cc));
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(
                                ex,
                                "Impossible d'ajouter l'adresse CC: {Email}",
                                cc
                            );
                        }
                    }
                }
            }

            // BCC (Copie carbone invisible) avec vérifications
            if (emailMessage.Bcc != null && emailMessage.Bcc.Any())
            {
                foreach (var bcc in emailMessage.Bcc)
                {
                    if (!string.IsNullOrWhiteSpace(bcc))
                    {
                        try
                        {
                            message.Bcc.Add(MailboxAddress.Parse(bcc));
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(
                                ex,
                                "Impossible d'ajouter l'adresse BCC: {Email}",
                                bcc
                            );
                        }
                    }
                }
            }

            // Sujet
            message.Subject = emailMessage.Subject ?? string.Empty;

            // Corps du message
            var builder = new BodyBuilder();

            if (emailMessage.IsHtml)
            {
                builder.HtmlBody = emailMessage.Body ?? string.Empty;
            }
            else
            {
                builder.TextBody = emailMessage.Body ?? string.Empty;
            }

            // Pièces jointes avec vérifications
            if (emailMessage.Attachments != null && emailMessage.Attachments.Any())
            {
                foreach (var attachment in emailMessage.Attachments)
                {
                    if (attachment != null && !string.IsNullOrWhiteSpace(attachment.FileName))
                    {
                        try
                        {
                            var content = attachment.Content ?? Array.Empty<byte>();
                            var contentType = ContentType.Parse(
                                attachment.ContentType ?? "application/octet-stream"
                            );
                            builder.Attachments.Add(attachment.FileName, content, contentType);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(
                                ex,
                                "Impossible d'ajouter la pièce jointe: {FileName}",
                                attachment.FileName
                            );
                        }
                    }
                }
            }

            message.Body = builder.ToMessageBody();

            return message;
        }

        private async Task SendMessageAsync(MimeMessage message, EmailSettings settings)
        {
            if (message == null)
                throw new ArgumentNullException(nameof(message));

            if (settings == null)
                throw new ArgumentNullException(nameof(settings));

            // Vérifications des paramètres SMTP
            if (string.IsNullOrWhiteSpace(settings.SmtpServer))
                throw new InvalidOperationException("Le serveur SMTP n'est pas configuré");

            if (string.IsNullOrWhiteSpace(settings.Username))
                throw new InvalidOperationException(
                    "Le nom d'utilisateur SMTP n'est pas configuré"
                );

            if (string.IsNullOrWhiteSpace(settings.Password))
                throw new InvalidOperationException("Le mot de passe SMTP n'est pas configuré");

            using var smtp = new SmtpClient();

            try
            {
                _logger.LogInformation(
                    "Connexion au serveur SMTP {SmtpServer}:{SmtpPort}",
                    settings.SmtpServer,
                    settings.SmtpPort
                );

                await smtp.ConnectAsync(
                    settings.SmtpServer,
                    settings.SmtpPort,
                    settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None
                );

                _logger.LogInformation("Authentification avec {Username}", settings.Username);

                await smtp.AuthenticateAsync(settings.Username, settings.Password);

                _logger.LogInformation("Envoi de l'email à {To}", message.To);

                await smtp.SendAsync(message);

                _logger.LogInformation("Email envoyé avec succès à {To}", message.To);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi de l'email à {To}", message.To);
                throw new InvalidOperationException(
                    $"Erreur lors de l'envoi de l'email : {ex.Message}",
                    ex
                );
            }
            finally
            {
                await smtp.DisconnectAsync(true);
            }
        }
    }
}

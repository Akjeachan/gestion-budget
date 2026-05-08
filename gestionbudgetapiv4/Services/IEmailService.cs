using GESTIONBUDGETAPI.Module;

namespace GESTIONBUDGETAPI.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Envoie un email avec un objet EmailMessage complet
        /// </summary>
        Task SendEmailAsync(EmailMessage emailMessage);

        /// <summary>
        /// Envoie un email simple avec les paramètres de base
        /// </summary>
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);

        /// <summary>
        /// Envoie un email en utilisant un template pour un utilisateur spécifique
        /// </summary>
        Task SendEmailWithTemplateAsync(
            int userId,
            string toEmail,
            string templateName,
            Dictionary<string, string> parameters
        );

        /// <summary>
        /// Envoie un email de plannification aux administrateurs
        /// </summary>
        Task SendEmailPlannification(string templateName, Dictionary<string, string> parameters);

        /// <summary>
        /// Envoie un email de validation de plannification aux administrateurs
        /// </summary>
        Task SendEmailPlannificationValider(
            string templateName,
            Dictionary<string, string> parameters
        );

        /// <summary>
        /// Envoie un email de réalisation aux administrateurs
        /// </summary>
        Task SendEmailRealisation(string templateName, Dictionary<string, string> parameters);

        /// <summary>
        /// Envoie un email de validation de réalisation aux administrateurs
        /// </summary>
        Task SendEmailRealisationValider(
            string templateName,
            Dictionary<string, string> parameters
        );

        /// <summary>
        /// Envoie un email aux administrateurs du département Direction
        /// </summary>
        Task SendEmailToAdminsAsync(string templateName, Dictionary<string, string> parameters);
    }
}

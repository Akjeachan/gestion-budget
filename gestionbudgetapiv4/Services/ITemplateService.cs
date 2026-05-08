namespace GESTIONBUDGETAPI.Services
{
    public interface ITemplateService
    {
        Task<string> RenderTemplateAsync(
            string templateName,
            Dictionary<string, string> parameters
        );
        string GetTemplateSubject(string templateName, Dictionary<string, string> parameters);
    }
}

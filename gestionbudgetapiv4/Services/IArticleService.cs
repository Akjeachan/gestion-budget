using GESTIONBUDGETAPI.Module;

namespace GESTIONBUDGETAPI.Services
{
    public interface IArticleService
    {
        /// <summary>
        /// Récupère tous les articles qui n'existent pas dans la table produit
        /// </summary>
        Task<List<Article>> GetArticlesNotInProduitAsync();
    }
}

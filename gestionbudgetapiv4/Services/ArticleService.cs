using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Services
{
    public class ArticleService : IArticleService
    {
        private readonly BijouContext _bijouContext;
        private readonly BudgetContext _budgetContext;

        public ArticleService(BijouContext bijouContext, BudgetContext budgetContext)
        {
            _bijouContext = bijouContext ?? throw new ArgumentNullException(nameof(bijouContext));
            _budgetContext =
                budgetContext ?? throw new ArgumentNullException(nameof(budgetContext));
        }

        /// <summary>
        /// Récupère tous les articles de Bijou n'existant pas dans la table produit de Budget
        /// </summary>
        public async Task<List<Article>> GetArticlesNotInProduitAsync()
        {
            var articlesUniques = await _bijouContext.Articles
                .FromSqlRaw(@"
                    SELECT *
                    FROM F_ARTICLE article
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM BUDGETSOFTWELL.dbo.produit budget
                        WHERE article.AR_Ref = budget.prod_articleref
                    )")
                .ToListAsync();

            return articlesUniques;
        }
    }
}

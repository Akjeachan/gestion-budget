using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using GESTIONBUDGETAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RubriqueController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;
        private readonly BijouContext _bijouContext;
        private readonly IArticleService _articleService;

        public RubriqueController(
            BudgetContext BudgetContext,
            BijouContext bijouContext,
            IArticleService articleService
        )
        {
            _budgetContext = BudgetContext;
            _bijouContext = bijouContext;
            _articleService = articleService;
        }

        [HttpPost]
        public ActionResult<Rubrique> Create([FromBody] Rubrique rubrique)
        {
            _budgetContext.Rubriques.Add(rubrique);
            _budgetContext.SaveChanges();
            return Ok(rubrique);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Rubrique>> GetAll()
        {
            return _budgetContext.Rubriques.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Rubrique> GetById(int id)
        {
            var rubrique = _budgetContext.Rubriques.Find(id);
            return Ok(rubrique);
        }

        [HttpGet("article")]
        public ActionResult<Article> GetArticleSage()
        {
            var article = _bijouContext.Articles.ToList();
            return Ok(article);
        }

        [HttpGet("articleunique")]
        public async Task<ActionResult<List<Article>>> GetArticleSageUnique()
        {
            var article = await _articleService.GetArticlesNotInProduitAsync();
            return Ok(article);
        }

        [HttpPut("{id:int}")]
        public ActionResult<Rubrique> Update(int id, [FromBody] Rubrique rubrique)
        {
            var existingrubrique = _budgetContext.Rubriques.Find(id);
            if (existingrubrique == null)
            {
                return NotFound($"Rubrique avec ID {id} introuvable.");
            }

            existingrubrique.rub_nom = rubrique.rub_nom;
            existingrubrique.rub_reference = rubrique.rub_reference;
            _budgetContext.SaveChanges();

            return Ok(existingrubrique);
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var rubrique = _budgetContext.Rubriques.Find(id);
            if (rubrique == null)
            {
                return NotFound(new { Message = $"Rubrique with id{id}not found." });
            }
            _budgetContext.Rubriques.Remove(rubrique);
            _budgetContext.SaveChanges();
            return Ok(new { Message = $"Rubrique with ID {id} was successfully deleted." });
        }
    }
}

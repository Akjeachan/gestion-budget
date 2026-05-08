using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProduitController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;
        private readonly BijouContext _bijouContext;

        public ProduitController(BudgetContext BudgetContext, BijouContext bijouContext)
        {
            _budgetContext = BudgetContext;
            _bijouContext = bijouContext;
        }

        [HttpPost]
        public ActionResult<Produit> Create([FromBody] Produit produit)
        {
            var article = _bijouContext.Articles.FirstOrDefault(a =>
                a.AR_Ref == produit.prod_articleref
            );
            if (article == null)
                return BadRequest(
                    new { message = "L'article 'non validé' n'existe pas dans la base." }
                );
            produit.prod_name = article.AR_Design;
            _budgetContext.Produits.Add(produit);
            _budgetContext.SaveChanges();
            return Ok(produit);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Produit>> GetAll()
        {
            return _budgetContext.Produits.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Produit> GetById(int id)
        {
            var produit = _budgetContext.Produits.Find(id);
            return Ok(produit);
        }

        [HttpPut("{id:int}")]
        public ActionResult<Produit> Update(int id, [FromBody] Produit produit)
        {
            var existingProduit = _budgetContext.Produits.Find(id);
            if (existingProduit == null)
            {
                return NotFound($"Produit avec ID {id} introuvable.");
            }

            existingProduit.prod_articleref = produit.prod_articleref;
            existingProduit.prod_rubriqueref = produit.prod_rubriqueref;
            _budgetContext.SaveChanges();

            return Ok(existingProduit);
        }

        [HttpPut("utilisateur/{id:int}")]
        public ActionResult<Produit> UpdateAdmin(int id, [FromBody] Produit produit)
        {
            var existingProduit = _budgetContext.Produits.Find(id);
            if (existingProduit == null)
            {
                return NotFound($"Produit avec ID {id} introuvable.");
            }

            existingProduit.prod_articleref = produit.prod_articleref;
            existingProduit.prod_rubriqueref = produit.prod_rubriqueref;
            _budgetContext.SaveChanges();

            return Ok(existingProduit);
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var produit = _budgetContext.Produits.Find(id);
            if (produit == null)
            {
                return NotFound(new { Message = $"Produit with id{id}not found." });
            }
            _budgetContext.Produits.Remove(produit);
            _budgetContext.SaveChanges();
            return Ok(new { Message = $"Produit with ID {id} was successfully deleted." });
        }
    }
}

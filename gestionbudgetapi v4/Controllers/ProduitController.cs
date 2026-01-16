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
        public ProduitController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }
        [HttpPost]
        public ActionResult<Produit> Create([FromBody] Produit produit)
        {
            produit.prod_dateajout = DateTime.Now;
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

            existingProduit.prod_name = produit.prod_name;
            existingProduit.prod_updateby = produit.prod_updateby;
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

            existingProduit.prod_name = produit.prod_name;
            existingProduit.prod_updateby = produit.prod_updateby;
            existingProduit.prod_numerocompteid = produit.prod_numerocompteid;
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
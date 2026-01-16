using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReaffectationController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public ReaffectationController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        [HttpPost]
        public async Task<ActionResult<Reaffectation>> Create(
            [FromBody] Reaffectation reaffectation
        )
        {
            reaffectation.reaffect_datereaffectation = DateTime.Now;
            reaffectation.reaffect_etat = false;

            await _budgetContext.Reaffectations.AddAsync(reaffectation);

            var budget1 = await _budgetContext.Budgets.FindAsync(reaffectation.reaffect_budget1id);
            var budget2 = await _budgetContext.Budgets.FindAsync(reaffectation.reaffect_budget2id);

            if (budget1 == null || budget2 == null)
                return BadRequest("Un des budgets n'existe pas.");

            if (budget1.budget_montant < reaffectation.reaffect_montantreaffectation)
                return BadRequest("Le budget source n'a pas assez de fonds.");

            budget1.budget_montant -= reaffectation.reaffect_montantreaffectation;
            budget2.budget_montant += reaffectation.reaffect_montantreaffectation;

            await _budgetContext.SaveChangesAsync();

            return Ok(reaffectation);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Reaffectation>> GetAll()
        {
            return _budgetContext.Reaffectations.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Reaffectation> GetById(int id)
        {
            var reaffectation = _budgetContext.Reaffectations.Find(id);
            if (reaffectation == null)
                return NotFound($"Reaffectation avec ID {id} introuvable.");
            return Ok(reaffectation);
        }

        // [HttpGet("utilisateur/{id}")]
        // public ActionResult<IEnumerable<Plannification>> GetByUtilisateurId(int id)
        // {
        //     var etat = _budgetContext.Etat_Plannifications
        //                             .FirstOrDefault(e => e.etatp_name == "validé");
        //     if (etat == null)
        //     {
        //         return BadRequest("L'état 'validé' n'existe pas dans la base.");
        //     }

        //     var plannifications = _budgetContext.v_Plannifications
        //         .Where(p => p.plan_createdby == id && p.plan_etatactionid == etat.etatp_id)
        //         .ToList();

        //     if (!plannifications.Any())
        //     {
        //         return NotFound(new { message = "Aucune plannification trouvée pour cet utilisateur." });
        //     }

        //     return Ok(plannifications);
        // }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<Reaffectation>> Update(
            int id,
            [FromBody] Reaffectation reaffectation
        )
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingReaffectation = await _budgetContext.Reaffectations.FindAsync(id);
            if (existingReaffectation == null)
            {
                return NotFound($"Reaffectation avec ID {id} introuvable.");
            }

            existingReaffectation.reaffect_budget1id = reaffectation.reaffect_budget1id;
            existingReaffectation.reaffect_budget2id = reaffectation.reaffect_budget2id;
            existingReaffectation.reaffect_montantreaffectation =
                reaffectation.reaffect_montantreaffectation;
            existingReaffectation.reaffect_datereaffectation =
                reaffectation.reaffect_datereaffectation;

            await _budgetContext.SaveChangesAsync();

            return Ok(existingReaffectation);
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteById(int id)
        {
            var reaffectation = await _budgetContext.Reaffectations.FindAsync(id);
            if (reaffectation == null)
            {
                return NotFound(new { Message = $"Reaffectation avec ID {id} introuvable." });
            }

            _budgetContext.Reaffectations.Remove(reaffectation);
            await _budgetContext.SaveChangesAsync();

            return Ok(new { Message = $"reaffectation avec ID {id} supprimée avec succès." });
        }
    }
}

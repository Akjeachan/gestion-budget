using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClotureController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public ClotureController(BudgetContext budgetContext)
        {
            _budgetContext = budgetContext;
        }

        // ✅ Clôture simple d'une réalisation
        [HttpPut("{id:int}")]
        public ActionResult<Realisation> Update(int id)
        {
            var etat = _budgetContext.Etat_Realisations.FirstOrDefault(e =>
                e.etatr_name == "cloture"
            );

            var existingRealisation = _budgetContext.Realisations.Find(id);

            if (existingRealisation == null)
                return NotFound($"Realisation avec ID {id} introuvable.");

            if (etat == null)
                return NotFound("Etat 'cloture' introuvable.");

            // Mise à jour
            existingRealisation.real_actionid = etat.etatr_id;
            _budgetContext.SaveChanges();

            return Ok(existingRealisation);
        }

        [HttpGet("utilisateur/{id}")]
        public ActionResult<IEnumerable<Plannification>> GetByUtilisateurId(int id)
        {
            var etat = _budgetContext.Etat_Realisations.FirstOrDefault(e =>
                e.etatr_name == "valider"
            );
            if (etat == null)
            {
                return BadRequest("L'état 'valider' n'existe pas dans la base.");
            }

            var plannifications = _budgetContext
                .v_Plannifications.Where(p =>
                    p.plan_createdby == id && p.real_actionid == etat.etatr_id
                )
                .ToList();

            if (!plannifications.Any())
            {
                return NotFound(
                    new { message = "Aucune plannification trouvée pour cet utilisateur." }
                );
            }

            return Ok(plannifications);
        }

        // ✅ Clôture automatique avec impact sur le budget
        [HttpPut("autocloture/{id:int}")]
        public ActionResult<Realisation> ClotureRealisation(int id)
        {
            var etat = _budgetContext.Etat_Realisations.FirstOrDefault(e =>
                e.etatr_name == "cloture"
            );
            var etatp = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
                e.etatp_name == "cloturé"
            );

            var plannification = _budgetContext.v_Plannifications.FirstOrDefault(e =>
                e.real_id == id
            );

            if (plannification == null)
                return NotFound($"v_plannification avec ID {id} introuvable.");

            var existingRealisation = _budgetContext.Realisations.Find(id);
            if (existingRealisation == null)
                return NotFound($"Realisation avec ID {id} introuvable.");
            var existingPlannification = _budgetContext.Plannifications.Find(
                existingRealisation.real_plannificationid
            );
            if (existingPlannification == null)
                return NotFound(
                    $"Plannification avec ID {existingRealisation.real_plannificationid} introuvable."
                );

            var existingBudget = _budgetContext.Budgets.FirstOrDefault(b =>
                b.budget_plannificationid == plannification.plan_id
            );
            if (existingBudget == null)
                return NotFound(
                    $"Budget lié à la plannification {plannification.plan_id} introuvable."
                );

            if (etat == null)
                return NotFound("Etat 'cloture' introuvable.");
            if (etatp == null)
                return NotFound("Etat 'cloturé' introuvable.");

            // Mise à jour
            existingRealisation.real_actionid = etat.etatr_id;
            existingBudget.budget_montant -= plannification.real_montantreel;
            existingPlannification.plan_etatactionid -= etatp.etatp_id;

            if (existingBudget.budget_montant < 0)
                existingBudget.budget_montant = 0; // sécurité

            _budgetContext.SaveChanges();

            return Ok(existingRealisation);
        }
    }
}

using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlannificationController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public PlannificationController(BudgetContext budgetContext)
        {
            _budgetContext = budgetContext;
        }

        [HttpPost]
        public ActionResult<Plannification> Create([FromBody] Plannification plannification)
        {
            try
            {
                var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
                    e.etatp_name == "non validé"
                );
                if (etat == null)
                    return BadRequest(
                        new { message = "L'état 'non validé' n'existe pas dans la base." }
                    );

                // Obtenir le dernier ID (ou 0 si aucune plannification)
                int lastPlanId = _budgetContext
                    .Plannifications.OrderByDescending(p => p.plan_id)
                    .Select(p => p.plan_id)
                    .FirstOrDefault();

                // Incrémenter pour obtenir le prochain numéro de séquence
                int nextSequence = lastPlanId + 1;

                // Générer la référence : SEQUENCE-YEAR (ex: 1-2025, 2-2025, etc.)
                string planRef = $"PLAN-{nextSequence}-{DateTime.Now.Year}";

                plannification.plan_etatactionid = etat.etatp_id;
                plannification.plan_datecreation = DateTime.Now;
                plannification.plan_montanttotal =
                    plannification.plan_prixunitaire * plannification.plan_nombredemande;
                plannification.plan_ref = planRef;

                _budgetContext.Plannifications.Add(plannification);
                _budgetContext.SaveChanges();

                return Ok(plannification);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "Erreur lors de la création", error = ex.Message }
                );
            }
        }

        [HttpGet]
        public ActionResult<IEnumerable<v_Plannification>> GetAll()
        {
            try
            {
                return Ok(_budgetContext.v_Plannifications.AsNoTracking().ToList());
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "Erreur lors de la récupération", error = ex.Message }
                );
            }
        }

        [HttpGet("{id:int}")]
        public ActionResult<Plannification> GetById(int id)
        {
            try
            {
                var plannification = _budgetContext.Plannifications.Find(id);
                if (plannification == null)
                    return NotFound(new { message = $"Plannification {id} introuvable." });

                return Ok(plannification);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "Erreur lors de la récupération", error = ex.Message }
                );
            }
        }

        [HttpGet("utilisateur/{id}")]
        public ActionResult<IEnumerable<v_Plannification>> GetByUtilisateurId(int id)
        {
            try
            {
                var plannifications = _budgetContext
                    .v_Plannifications.AsNoTracking()
                    .Where(p => p.plan_createdby == id)
                    .ToList();

                return Ok(plannifications);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "Erreur lors de la récupération", error = ex.Message }
                );
            }
        }

        [HttpGet("avalider")]
        public ActionResult<IEnumerable<v_Plannification>> GetValidation()
        {
            try
            {
                var plannifications = _budgetContext
                    .v_Plannifications.AsNoTracking()
                    .Where(p => p.plan_etatactionid == 1)
                    .ToList();

                return Ok(plannifications);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "Erreur lors de la récupération", error = ex.Message }
                );
            }
        }

        [HttpGet("valider/{id}")]
        public ActionResult<IEnumerable<v_Plannification>> GetValider(int id)
        {
            try
            {
                var plannifications = _budgetContext
                    .v_Plannifications.AsNoTracking()
                    .Where(p => p.plan_etatactionid == 3 && p.plan_createdby == id)
                    .ToList();

                return Ok(plannifications);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "Erreur lors de la récupération", error = ex.Message }
                );
            }
        }

        [HttpPut("{id:int}")]
        public ActionResult<Plannification> Update(int id, [FromBody] Plannification plannification)
        {
            try
            {
                var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
                    e.etatp_name == "non validé"
                );
                var existingPlannification = _budgetContext.Plannifications.Find(id);

                if (existingPlannification == null)
                    return NotFound(new { message = $"Plannification {id} introuvable." });

                if (etat == null)
                    return NotFound(
                        new { message = "L'état 'non validé' n'existe pas dans la base." }
                    );

                existingPlannification.plan_dateecheance = plannification.plan_dateecheance;
                existingPlannification.plan_dateupdate = DateTime.Now;
                existingPlannification.plan_etatactionid = etat.etatp_id;
                existingPlannification.plan_produitid = plannification.plan_produitid;
                existingPlannification.plan_nombredemande = plannification.plan_nombredemande;
                existingPlannification.plan_prixunitaire = plannification.plan_prixunitaire;
                existingPlannification.plan_description = plannification.plan_description;
                existingPlannification.plan_montanttotal =
                    plannification.plan_prixunitaire * plannification.plan_nombredemande;

                _budgetContext.SaveChanges();

                return Ok(existingPlannification);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "Erreur lors de la mise à jour", error = ex.Message }
                );
            }
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            try
            {
                var plannification = _budgetContext.Plannifications.Find(id);
                if (plannification == null)
                    return NotFound(new { message = $"Plannification {id} introuvable." });

                _budgetContext.Plannifications.Remove(plannification);
                _budgetContext.SaveChanges();

                return Ok(new { message = $"Plannification {id} supprimée avec succès." });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "Erreur lors de la suppression", error = ex.Message }
                );
            }
        }
    }
}

using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BonPrecommandeController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public BonPrecommandeController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        //         [HttpPost]
        //         public ActionResult<BonPrecommande> Create([FromBody] BonPrecommande bonprecommande)
        //         {
        //             var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
        //                 e.etatp_name == "non validé"
        //             );
        //             if (etat == null)
        //             {
        //                 return BadRequest("L'état 'non validé' n'existe pas dans la base.");
        //             }
        //             bonprecommande.bon_actionid = etat.etatp_id;
        //             bonprecommande.plan_datecreation = DateTime.Now;
        //             _budgetContext.BonPrecommandes.Add(bonprecommande);
        //             _budgetContext.SaveChanges();
        //             return Ok(bonprecommande);
        //         }

        //         [HttpGet]
        //         public ActionResult<IEnumerable<v_Plannification>> GetAll()
        //         {
        //             return _budgetContext.v_Plannifications.ToList();
        //         }

        //         [HttpGet("{id:int}")]
        //         public ActionResult<Plannification> GetById(int id)
        //         {
        //             var plannification = _budgetContext.Plannifications.Find(id);
        //             return Ok(plannification);
        //         }

        //         [HttpGet("utilisateur/{id}")]
        //         public ActionResult<IEnumerable<Plannification>> GetByUtilisateurId(int id)
        //         {
        //             var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
        //                 e.etatp_name == "non validé"
        //             );
        //             if (etat == null)
        //             {
        //                 return BadRequest("L'état 'non validé' n'existe pas dans la base.");
        //             }
        //             var plannifications = _budgetContext
        //                 .v_Plannifications.Where(p => p.plan_createdby == id)
        //                 .ToList();

        //             if (!plannifications.Any())
        //             {
        //                 return NotFound(
        //                     new { message = "Aucune plannification trouvée pour cet utilisateur." }
        //                 );
        //             }

        //             return Ok(plannifications);
        //         }

        [HttpGet("{id:int}")]
        public ActionResult<IEnumerable<BonPrecommande>> GetValidation(int id)
        {
            var etat = _budgetContext.Etats.FirstOrDefault(e => e.etat_name == "non validé");
            if (etat == null)
                return BadRequest(
                    new { message = "L'état 'non validé' n'existe pas dans la base." }
                );
            try
            {
                var bonprecommande = _budgetContext
                    .V_BonPrecommandes.Where(b => b.user_id == id && b.bon_etatid == etat.etat_id)
                    .GroupBy(b => b.bon_id)
                    .Select(g => g.FirstOrDefault())
                    .ToList();

                if (!bonprecommande.Any())
                {
                    return NotFound(new { message = "Aucune bon pre commande trouvée." });
                }

                return Ok(bonprecommande);
            }
            catch (Exception ex)
            {
                // Loggez l'erreur pour voir le détail
                return StatusCode(500, new { message = "Erreur serveur", detail = ex.Message });
            }
        }

        //         [HttpGet("valider/{id}")]
        //         public ActionResult<IEnumerable<Plannification>> GetValider(int id)
        //         {
        //             var plannifications = _budgetContext
        //                 .v_Plannifications.Where(p => p.plan_etatactionid == 3 && p.plan_createdby == id)
        //                 .ToList();

        //             if (!plannifications.Any())
        //             {
        //                 return NotFound(new { message = "Aucune plannification trouvée." });
        //             }

        //             return Ok(plannifications);
        //         }

        //         // [HttpPut("{id:int}")]
        //         // public ActionResult<Plannification> Update(int id, [FromBody] Plannification plannification)
        //         // {
        //         //     var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
        //         //         e.etatp_name == "non valider"
        //         //     );
        //         //     var existingPlannification = _budgetContext.Plannifications.Find(id);
        //         //     if (existingPlannification == null)
        //         //     {
        //         //         return NotFound($"Plannification avec ID {id} introuvable.");
        //         //     }
        //         //     if (etat == null)
        //         //     {
        //         //         return NotFound($"etat avec ID {id} introuvable.");
        //         //     }

        //         //     existingPlannification.plan_dateecheance = plannification.plan_dateecheance;
        //         //     existingPlannification.plan_dateupdate = DateTime.Now;
        //         //     existingPlannification.plan_etatactionid = etat.etatp_id;
        //         //     existingPlannification.plan_produitid = plannification.plan_produitid;
        //         //     existingPlannification.plan_nombredemande = plannification.plan_nombredemande;
        //         //     existingPlannification.plan_prixunitaire = plannification.plan_prixunitaire;
        //         //     existingPlannification.plan_description = plannification.plan_description;

        //         //     _budgetContext.SaveChanges();

        //         //     return Ok(existingPlannification);
        //         // }

        //         [HttpDelete("{id:int}")]
        //         public ActionResult DeleteById(int id)
        //         {
        //             var plannification = _budgetContext.Plannifications.Find(id);
        //             if (plannification == null)
        //             {
        //                 return NotFound(new { Message = $"Plannification with id{id}not found." });
        //             }
        //             _budgetContext.Plannifications.Remove(plannification);
        //             _budgetContext.SaveChanges();
        //             return Ok(new { Message = $"plannification with ID {id} was successfully deleted." });
        //         }
    }
}

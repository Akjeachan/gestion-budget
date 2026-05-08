using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComparaisonController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;
        private readonly BijouContext _bijouContext;

        public ComparaisonController(BudgetContext budgetContext, BijouContext bijouContext)
        {
            _budgetContext = budgetContext;
            _bijouContext = bijouContext;
        }

        /// <summary>
        /// Récupérer la comparaison entre les budgets planifiés et réalisés
        /// </summary>
        [HttpGet("budgets-vs-realisations")]
        public async Task<ActionResult<IEnumerable<object>>> ComparerBudgetsVsRealisations()
        {
            try
            {
                var comparaison =
                    from v in _budgetContext.v_Plannifications
                    group v by v.plan_id into grp
                    select new
                    {
                        PlanId = grp.Key,
                        PlanDescription = grp.First().plan_description,
                        ProdName = grp.First().prod_name,
                        MontantPlanifie = grp.First().plan_montanttotal,
                        MontantRealise = grp.Sum(x => x.real_montantreel ?? 0),
                        Ecart = grp.First().plan_montanttotal
                            - grp.Sum(x => x.real_montantreel ?? 0),
                        DateCreation = grp.First().plan_datecreation,
                        DateModification = grp.First().plan_dateupdate,
                    };

                return Ok(await comparaison.ToListAsync());
            }
            catch (Exception ex)
            {
                return BadRequest($"Erreur lors de la comparaison : {ex.Message}");
            }
        }

        /// <summary>
        /// Récupérer toutes les réalisations avec comparaison
        /// </summary>
        [HttpGet("realisations")]
        public async Task<ActionResult<IEnumerable<object>>> GetRealisations()
        {
            try
            {
                var realisations =
                    from r in _budgetContext.Realisations
                    join p in _budgetContext.Plannifications
                        on r.real_plannificationid equals p.plan_id
                    select new
                    {
                        RealisationId = r.real_id,
                        PlannificationId = p.plan_id,
                        Description = r.real_description,
                        PrixUnitaire = r.real_prixunitaire,
                        MontantReel = r.real_montantreel,
                        MontantPlanifie = p.plan_montanttotal,
                        Ecart = p.plan_montanttotal - (r.real_montantreel ?? 0),
                        DateRealisation = r.real_daterealisation,
                        Image = r.real_image,
                    };

                return Ok(await realisations.ToListAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Erreur lors de la récupération des réalisations : {ex.Message}"
                );
            }
        }

        /// <summary>
        /// Récupérer les statistiques globales de comparaison
        /// </summary>
        [HttpGet("statistiques")]
        public async Task<ActionResult<object>> GetStatistiques()
        {
            try
            {
                var plannifications = await _budgetContext.Plannifications.ToListAsync();
                var realisations = await _budgetContext.Realisations.ToListAsync();
                var bonCommandes = await _bijouContext.BonCommandeSages.ToListAsync();
                var factures = await _bijouContext.FactureSages.ToListAsync();

                decimal montantTotalPlanifie = plannifications.Sum(p => p.plan_montanttotal);
                decimal montantTotalRealise = realisations.Sum(r => r.real_montantreel ?? 0);
                decimal montantTotalBonCommandeHT = bonCommandes.Sum(b => b.DL_MontantHT);
                decimal montantTotalBonCommandeTTC = bonCommandes.Sum(b => b.DL_MontantTTC);
                decimal montantTotalFactureHT = factures.Sum(f => f.DL_MontantHT);
                decimal montantTotalFactureTTC = factures.Sum(f => f.DL_MontantTTC);
                decimal ecartTotal = montantTotalPlanifie - montantTotalRealise;
                decimal ecartPlanVsBonCommande =
                    montantTotalPlanifie - montantTotalBonCommandeTTC;
                decimal ecartPlanVsFacture = montantTotalPlanifie - montantTotalFactureTTC;
                decimal ecartBonCommandeVsFacture =
                    montantTotalBonCommandeTTC - montantTotalFactureTTC;
                decimal pourcentageRealisation =
                    montantTotalPlanifie > 0
                        ? (montantTotalRealise / montantTotalPlanifie) * 100
                        : 0;
                decimal pourcentageBonCommande =
                    montantTotalPlanifie > 0
                        ? (montantTotalBonCommandeTTC / montantTotalPlanifie) * 100
                        : 0;
                decimal pourcentageFacture =
                    montantTotalPlanifie > 0
                        ? (montantTotalFactureTTC / montantTotalPlanifie) * 100
                        : 0;

                return Ok(
                    new
                    {
                        NombrePlannifications = plannifications.Count,
                        NombreRealisations = realisations.Count,
                        NombreBonCommandes = bonCommandes.Count,
                        NombreFactures = factures.Count,
                        MontantTotalPlanifie = montantTotalPlanifie,
                        MontantTotalRealise = montantTotalRealise,
                        MontantTotalBonCommandeHT = montantTotalBonCommandeHT,
                        MontantTotalBonCommandeTTC = montantTotalBonCommandeTTC,
                        MontantTotalFactureHT = montantTotalFactureHT,
                        MontantTotalFactureTTC = montantTotalFactureTTC,
                        EcartTotal = ecartTotal,
                        EcartPlanVsBonCommande = ecartPlanVsBonCommande,
                        EcartPlanVsFacture = ecartPlanVsFacture,
                        EcartBonCommandeVsFacture = ecartBonCommandeVsFacture,
                        PourcentageRealisation = Math.Round(pourcentageRealisation, 2),
                        PourcentageBonCommande = Math.Round(pourcentageBonCommande, 2),
                        PourcentageFacture = Math.Round(pourcentageFacture, 2),
                    }
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Erreur lors de la récupération des statistiques : {ex.Message}"
                );
            }
        }

        /// <summary>
        /// Récupérer la comparaison pour une plannification spécifique
        /// </summary>
        [HttpGet("detail/{id:int}")]
        public async Task<ActionResult<object>> ComparerPlannification(int id)
        {
            try
            {
                var plannification = await _budgetContext.Plannifications.FindAsync(id);
                if (plannification == null)
                {
                    return NotFound($"Plannification avec ID {id} introuvable.");
                }

                var realisations = await _budgetContext
                    .Realisations.Where(r => r.real_plannificationid == id)
                    .ToListAsync();

                decimal montantRealise = realisations.Sum(r => r.real_montantreel ?? 0);
                decimal ecart = plannification.plan_montanttotal - montantRealise;
                decimal pourcentageRealisation =
                    plannification.plan_montanttotal > 0
                        ? (montantRealise / plannification.plan_montanttotal) * 100
                        : 0;

                return Ok(
                    new
                    {
                        PlanId = plannification.plan_id,
                        PlanDescription = plannification.plan_description,
                        PrixUnitaire = plannification.plan_prixunitaire,
                        NombreDemande = plannification.plan_nombredemande,
                        MontantPlanifie = plannification.plan_montanttotal,
                        MontantRealise = montantRealise,
                        Ecart = ecart,
                        PourcentageRealisation = Math.Round(pourcentageRealisation, 2),
                        NombreRealisations = realisations.Count,
                        DateCreation = plannification.plan_datecreation,
                        DateModification = plannification.plan_dateupdate,
                    }
                );
            }
            catch (Exception ex)
            {
                return BadRequest($"Erreur lors de la comparaison : {ex.Message}");
            }
        }

        /// <summary>
        /// Récupérer bon de commande venant de sage
        /// </summary>
        [HttpGet("boncommande")]
        public async Task<ActionResult<object>> ListBondeCommandeSage()
        {
            try
            {
                var boncommande = await _bijouContext.BonCommandeSages.ToListAsync();
                if (boncommande.Count == 0)
                {
                    return NotFound("Aucun bon de commande trouvé.");
                }
                return Ok(boncommande);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Erreur lors de la récupération des bons de commande : {ex.Message}"
                );
            }
        }

        /// <summary>
        /// Récupérer bon de facture venant de sage
        /// </summary>
        [HttpGet("facture")]
        public async Task<ActionResult<object>> ListFactureSage()
        {
            try
            {
                var facture = await _bijouContext.FactureSages.ToListAsync();
                if (facture.Count == 0)
                {
                    return NotFound("Aucune facture trouvée.");
                }
                return Ok(facture);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erreur lors de la récupération des factures : {ex.Message}");
            }
        }
    }
}

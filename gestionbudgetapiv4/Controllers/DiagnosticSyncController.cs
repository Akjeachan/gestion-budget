using GESTIONBUDGETAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticSyncController : ControllerBase
    {
        private readonly BijouContext _bijouContext;
        private readonly BudgetContext _budgetContext;
        private readonly ILogger<DiagnosticSyncController> _logger;

        public DiagnosticSyncController(
            BijouContext bijouContext,
            BudgetContext budgetContext,
            ILogger<DiagnosticSyncController> logger
        )
        {
            _bijouContext = bijouContext;
            _budgetContext = budgetContext;
            _logger = logger;
        }

        [HttpGet("sage-stats")]
        public async Task<IActionResult> GetSageStats()
        {
            try
            {
                // Nombre total de lignes
                var totalLignes = await _bijouContext.V_BonPrecommandeSage.CountAsync();

                // Tous les cbMarq distincts
                var cbMarqDistincts = await _bijouContext
                    .V_BonPrecommandeSage.Select(s => s.cbMarq)
                    .Distinct()
                    .OrderBy(x => x)
                    .ToListAsync();

                // Grouper par cbMarq pour voir combien de lignes par bon
                var lignesParBon = await _bijouContext
                    .V_BonPrecommandeSage.GroupBy(s => s.cbMarq)
                    .Select(g => new
                    {
                        cbMarq = g.Key,
                        NombreLignes = g.Count(),
                        Articles = g.Select(x => x.AR_Ref).ToList(),
                    })
                    .OrderBy(x => x.cbMarq)
                    .ToListAsync();

                // Tracker actuel
                var tracker = await _budgetContext.SyncTrackers.FirstOrDefaultAsync();
                var lastSyncedId = tracker?.LastSyncedId ?? 0;

                // cbMarq qui passeraient le filtre
                var cbMarqFiltrables = cbMarqDistincts.Where(x => x > lastSyncedId).ToList();

                return Ok(
                    new
                    {
                        TotalLignes = totalLignes,
                        NombreBonsDistincts = cbMarqDistincts.Count,
                        TodosLosCbMarq = cbMarqDistincts,
                        LastSyncedId = lastSyncedId,
                        CbMarqRecuperablesAvecFiltreActuel = cbMarqFiltrables,
                        NombreCbMarqRecuperables = cbMarqFiltrables.Count,
                        DetailLignesParBon = lignesParBon,
                        Explication = totalLignes == 1 && cbMarqDistincts.Count == 1
                            ? "⚠️ Il n'y a qu'UN SEUL bon (cbMarq=194) dans Sage!"
                        : lignesParBon.Count == 1
                            ? $"⚠️ Les {totalLignes} lignes appartiennent TOUTES au même bon (cbMarq={cbMarqDistincts[0]}). La déduplication garde seulement 1 article!"
                        : cbMarqFiltrables.Count == 0
                            ? $"⚠️ Tous les cbMarq sont ≤ {lastSyncedId}. Réinitialisez le tracker!"
                        : $"✅ {cbMarqFiltrables.Count} bon(s) devraient être récupérés",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du diagnostic Sage");
                return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        [HttpPost("reset-tracker")]
        public async Task<IActionResult> ResetTracker([FromQuery] int newValue = 0)
        {
            try
            {
                var tracker = await _budgetContext.SyncTrackers.FirstOrDefaultAsync();
                if (tracker != null)
                {
                    var oldValue = tracker.LastSyncedId;
                    tracker.LastSyncedId = newValue;
                    tracker.LastSyncDate = DateTime.Now;
                    await _budgetContext.SaveChangesAsync();

                    return Ok(
                        new
                        {
                            Message = $"Tracker réinitialisé de {oldValue} à {newValue}",
                            OldValue = oldValue,
                            NewValue = newValue,
                        }
                    );
                }

                return NotFound("Tracker non trouvé");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la réinitialisation du tracker");
                return StatusCode(500, new { Error = ex.Message });
            }
        }
    }
}

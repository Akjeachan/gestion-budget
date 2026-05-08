using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RealisationController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;
        private readonly IWebHostEnvironment _environment;

        public RealisationController(BudgetContext BudgetContext, IWebHostEnvironment environment)
        {
            _budgetContext = BudgetContext;
            _environment = environment;
        }

        [HttpPost("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<Realisation>> Create(
            int id,
            [FromForm] decimal real_prixunitaire,
            [FromForm] string real_description,
            [FromForm] IFormFile? image
        )
        {
            var etat = await _budgetContext.Etats.FirstOrDefaultAsync(e =>
                e.etat_name == "en cours"
            );
            if (etat == null)
            {
                return BadRequest("L'état 'en cours' n'existe pas dans la base.");
            }

            var plannification = await _budgetContext.Plannifications.FirstOrDefaultAsync(p =>
                p.plan_id == id
            );
            if (plannification == null)
            {
                return BadRequest("La plannification n'existe pas dans la base.");
            }

            var montantreel = real_prixunitaire * plannification.plan_nombredemande;

            var realisation = new Realisation
            {
                real_actionid = etat.etat_id,
                real_plannificationid = plannification.plan_id,
                real_montantreel = montantreel,
                real_daterealisation = DateTime.Now,
                real_prixunitaire = real_prixunitaire,
                real_description = real_description,
            };

            // Gestion de l'upload d'image
            if (image != null && image.Length > 0)
            {
                var uploadsFolder = Path.Combine(
                    _environment.WebRootPath,
                    "uploads",
                    "realisations"
                );
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{image.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(fileStream);
                }

                realisation.real_image = $"/uploads/realisations/{uniqueFileName}";
            }

            await _budgetContext.Realisations.AddAsync(realisation);
            await _budgetContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = realisation.real_id }, realisation);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Realisation>> GetAll()
        {
            return _budgetContext.Realisations.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Realisation> GetById(int id)
        {
            var realisation = _budgetContext.Realisations.Find(id);
            if (realisation == null)
                return NotFound($"Realisation avec ID {id} introuvable.");
            return Ok(realisation);
        }

        [HttpGet("utilisateur/{id}")]
        public ActionResult<IEnumerable<Plannification>> GetByUtilisateurId(int id)
        {
            var etat = _budgetContext.Etats.FirstOrDefault(e => e.etat_name == "validé");
            if (etat == null)
            {
                return BadRequest("L'état 'validé' n'existe pas dans la base.");
            }

            var plannifications = _budgetContext
                .v_Plannifications.Where(p =>
                    p.plan_createdby == id && p.plan_etatactionid == etat.etat_id
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

        [HttpGet("realisationencours")]
        public ActionResult<IEnumerable<object>> GetByetat()
        {
            var etat = _budgetContext.Etats.FirstOrDefault(e => e.etat_name == "non validé");
            var etatvalider = _budgetContext.Etats.FirstOrDefault(e => e.etat_name == "validé");
            if (etat == null || etatvalider == null)
            {
                return BadRequest("L'état 'non validé' ou 'validé' n'existe pas dans la base.");
            }

            var realisations = _budgetContext
                .Realisations.Where(r =>
                    r.real_actionid == etat.etat_id || r.real_actionid == etatvalider.etat_id
                )
                .Join(
                    _budgetContext.Plannifications,
                    r => r.real_plannificationid,
                    p => p.plan_id,
                    (r, p) => new { r, p }
                )
                .Join(
                    _budgetContext.Produits,
                    rp => rp.p.plan_produitid,
                    prod => prod.prod_id,
                    (rp, prod) =>
                        new
                        {
                            rp.r,
                            rp.p,
                            prod,
                        }
                )
                .Join(
                    _budgetContext.Budgets,
                    rpp => rpp.p.plan_id,
                    b => b.budget_plannificationid,
                    (rpp, b) =>
                        new
                        {
                            rpp.r,
                            rpp.p,
                            rpp.prod,
                            b,
                        }
                )
                .Select(x => new
                {
                    x.r.real_id,
                    x.r.real_prixunitaire,
                    x.r.real_montantreel,
                    x.r.real_description,
                    x.r.real_daterealisation,
                    x.r.real_actionid,
                    x.r.real_image,
                    x.p.plan_id,
                    x.p.plan_prixunitaire,
                    x.p.plan_nombredemande,
                    x.p.plan_montanttotal,
                    x.p.plan_description,
                    x.prod.prod_id,
                    x.prod.prod_name,
                    x.b.budget_code,
                    x.b.budget_montant,
                    etatp_name = x.r.real_actionid == etat.etat_id ? "non validé" : "validé",
                })
                .ToList();

            if (!realisations.Any())
            {
                return Ok(new List<object>());
            }

            return Ok(realisations);
        }

        // ✨ NOUVELLE MÉTHODE avec upload d'image
        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<Realisation>> Update(
            int id,
            [FromForm] string? description,
            [FromForm] IFormFile? image
        )
        {
            var existingRealisation = await _budgetContext.Realisations.FindAsync(id);
            if (existingRealisation == null)
            {
                return NotFound($"Realisation avec ID {id} introuvable.");
            }

            // Gestion de l'upload d'image (seulement si fournie)
            if (image != null && image.Length > 0)
            {
                // Créer le dossier uploads s'il n'existe pas
                var uploadsFolder = Path.Combine(
                    _environment.WebRootPath,
                    "uploads",
                    "realisations"
                );
                Directory.CreateDirectory(uploadsFolder);

                // Générer un nom unique pour l'image
                var uniqueFileName = $"{Guid.NewGuid()}_{image.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Sauvegarder l'image
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(fileStream);
                }

                // Stocker le chemin relatif dans la base
                existingRealisation.real_image = $"/uploads/realisations/{uniqueFileName}";
            }

            // Mise à jour seulement de la description (si fournie)
            if (!string.IsNullOrEmpty(description))
            {
                existingRealisation.real_description = description;
            }

            await _budgetContext.SaveChangesAsync();

            return Ok(existingRealisation);
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteById(int id)
        {
            var realisation = await _budgetContext.Realisations.FindAsync(id);
            if (realisation == null)
            {
                return NotFound(new { Message = $"Realisation avec ID {id} introuvable." });
            }

            // Supprimer l'image du serveur si elle existe
            if (!string.IsNullOrEmpty(realisation.real_image))
            {
                var imagePath = Path.Combine(
                    _environment.WebRootPath,
                    realisation.real_image.TrimStart('/')
                );
                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }
            }

            _budgetContext.Realisations.Remove(realisation);
            await _budgetContext.SaveChangesAsync();

            return Ok(new { Message = $"Realisation avec ID {id} supprimée avec succès." });
        }

        [HttpPut("validation/{id:int}")]
        public ActionResult<Realisation> ValidationRealisation(int id)
        {
            var etat = _budgetContext.Etats.FirstOrDefault(e => e.etat_name == "validé");
            var existingRealisation = _budgetContext.Realisations.Find(id);

            if (existingRealisation == null)
                return NotFound($"Realisation avec ID {id} introuvable.");
            if (etat == null)
                return NotFound("Etat 'validé' introuvable.");

            existingRealisation.real_actionid = etat.etat_id;
            _budgetContext.SaveChanges();

            return Ok(existingRealisation);
        }
    }
}

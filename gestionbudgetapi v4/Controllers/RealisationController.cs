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
            var etat = await _budgetContext.Etat_Realisations.FirstOrDefaultAsync(e =>
                e.etatr_name == "en cours"
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
                real_actionid = etat.etatr_id,
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
            var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
                e.etatp_name == "validé"
            );
            if (etat == null)
            {
                return BadRequest("L'état 'validé' n'existe pas dans la base.");
            }

            var plannifications = _budgetContext
                .v_Plannifications.Where(p =>
                    p.plan_createdby == id && p.plan_etatactionid == etat.etatp_id
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
        public ActionResult<IEnumerable<Plannification>> GetByetat(int id)
        {
            var etat = _budgetContext.Etat_Realisations.FirstOrDefault(e =>
                e.etatr_name == "en cours"
            );
            if (etat == null)
            {
                return BadRequest("L'état 'en coures' n'existe pas dans la base.");
            }

            var plannifications = _budgetContext
                .v_Plannifications.Where(p => p.real_actionid == etat.etatr_id)
                .ToList();

            if (!plannifications.Any())
            {
                return NotFound(
                    new { message = "Aucune realisation trouvée pour cet utilisateur." }
                );
            }

            return Ok(plannifications);
        }

        // ✨ NOUVELLE MÉTHODE avec upload d'image
        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<Realisation>> Update(
            int id,
            [FromForm] decimal prixunitaire,
            [FromForm] string description,
            [FromForm] IFormFile? image
        )
        {
            var existingRealisation = await _budgetContext.Realisations.FindAsync(id);
            if (existingRealisation == null)
            {
                return NotFound($"Realisation avec ID {id} introuvable.");
            }

            var plannification = await _budgetContext.Plannifications.FindAsync(
                existingRealisation.real_plannificationid
            );
            if (plannification == null)
            {
                return NotFound($"Plannification introuvable.");
            }

            // Gestion de l'upload d'image
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

            // Mise à jour des autres champs
            existingRealisation.real_daterealisation = DateTime.Now;
            existingRealisation.real_description = description;
            existingRealisation.real_montantreel = prixunitaire * plannification.plan_nombredemande;
            existingRealisation.real_prixunitaire = prixunitaire;

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
            var etat = _budgetContext.Etat_Realisations.FirstOrDefault(e =>
                e.etatr_name == "valider"
            );
            var existingRealisation = _budgetContext.Realisations.Find(id);

            if (existingRealisation == null)
                return NotFound($"Realisation avec ID {id} introuvable.");
            if (etat == null)
                return NotFound("Etat 'valider' introuvable.");

            existingRealisation.real_actionid = etat.etatr_id;
            _budgetContext.SaveChanges();

            return Ok(existingRealisation);
        }
    }
}

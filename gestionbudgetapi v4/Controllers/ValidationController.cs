using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ValidationController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;
        private readonly IWebHostEnvironment _environment;

        public ValidationController(BudgetContext BudgetContext, IWebHostEnvironment environment)
        {
            _budgetContext = BudgetContext;
            _environment = environment;
        }

        [HttpPut("{id:int}/validationcg")]
        public ActionResult<Plannification> ValidationControllerGestion(
            int id,
            [FromBody] Plannification plannification
        )
        {
            var existingPlannification = _budgetContext.Plannifications.Find(id);
            var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
                e.etatp_name == "a validé"
            );

            if (etat == null)
                return BadRequest("L'état 'a validé' n'existe pas dans la base.");

            if (existingPlannification == null)
                return NotFound($"Plannification avec ID {id} introuvable.");

            existingPlannification.plan_etatactionid = etat.etatp_id;
            _budgetContext.SaveChanges();

            return Ok(existingPlannification);
        }

        [HttpPut("validationdirection/{id:int}")]
        public ActionResult ValidationDirection(int id)
        {
            var existingPlannification = _budgetContext.Plannifications.Find(id);
            var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
                e.etatp_name == "validé"
            );

            if (existingPlannification == null)
                return NotFound($"Plannification avec ID {id} introuvable.");

            if (etat == null)
                return BadRequest("L'état 'validé' n'existe pas dans la base.");

            // Mettre l'état à "validé"
            existingPlannification.plan_etatactionid = etat.etatp_id;
            _budgetContext.SaveChanges();

            // Vérifier si un budget existe déjà pour cette plannification
            var existingBudget = _budgetContext.Budgets.FirstOrDefault(b =>
                b.budget_plannificationid == existingPlannification.plan_id
            );

            if (existingBudget != null)
            {
                // Ne pas recréer un budget, retourner celui existant
                return Ok(
                    new { Plannification = existingPlannification, BudgetExistant = existingBudget }
                );
            }

            // Générer le code budget
            var lastBudget = _budgetContext
                .Budgets.OrderByDescending(b => b.budget_id)
                .FirstOrDefault();

            int nextSequence = 1;
            if (lastBudget != null && !string.IsNullOrEmpty(lastBudget.budget_code))
            {
                int.TryParse(lastBudget.budget_code.Substring(0, 3), out nextSequence);
                nextSequence++;
            }

            string sequencePart = nextSequence.ToString("D3");
            string datePart = DateTime.Now.ToString("yyyyMMdd");

            var budget = new Budget
            {
                budget_plannificationid = existingPlannification.plan_id,
                budget_code = $"{sequencePart}bdg{datePart}",
                budget_montant = existingPlannification.plan_montanttotal,
                budget_datecreation = DateTime.Now,
            };

            _budgetContext.Budgets.Add(budget);
            _budgetContext.SaveChanges();

            return Ok(new { Plannification = existingPlannification, BudgetCree = budget });
        }

        // ✅ MÉTHODE AVEC UPLOAD D'IMAGE
        [HttpPut("{id:int}/ValidationPrecommande")]
        public async Task<ActionResult<BonPrecommande>> ValidationPreCommande(int id)
        {
            try
            {
                // Récupération des données du formulaire
                var form = await Request.ReadFormAsync();

                var bon_dlprixunitaire = decimal.Parse(form["bon_dlprixunitaire"]);
                var bon_dlqte = int.Parse(form["bon_dlqte"]);
                var real_description = form["real_description"].ToString();
                var imageFile = form.Files.GetFile("real_image");

                // CORRECTION: Chercher par plan_id dans V_BonPrecommandes
                var vBonPrecommande = _budgetContext.V_BonPrecommandes.FirstOrDefault(v =>
                    v.plan_id == id
                );

                if (vBonPrecommande == null)
                    return NotFound($"BonPrecommande avec plan_id {id} introuvable.");

                // Récupérer le BonPrecommande correspondant via bon_id
                var existantBonPrecommande = _budgetContext.BonPrecommandes.Find(
                    vBonPrecommande.bon_id
                );

                if (existantBonPrecommande is null)
                    return NotFound(
                        $"BonPrecommande avec bon_id {vBonPrecommande.bon_id} introuvable."
                    );

                // Récupération des états nécessaires
                var etat = _budgetContext.Etat_Plannifications.FirstOrDefault(e =>
                    e.etatp_name == "validé"
                );
                var etatrealisation = _budgetContext.Etat_Realisations.FirstOrDefault(e =>
                    e.etatr_name == "en cours"
                );

                if (etat is null || etatrealisation is null)
                    return BadRequest(
                        "Les états requis ('validé' ou 'en cours') n'existent pas dans la base."
                    );

                // Vérification des champs obligatoires
                if (bon_dlprixunitaire <= 0 || bon_dlqte <= 0)
                    return BadRequest("Prix unitaire ou quantité invalides.");

                if (string.IsNullOrEmpty(real_description))
                    return BadRequest("La description est obligatoire.");

                // Gestion de l'upload d'image
                string imagePath = string.Empty;
                if (imageFile != null && imageFile.Length > 0)
                {
                    // Créer le dossier uploads s'il n'existe pas
                    var uploadsFolder = Path.Combine(
                        _environment.WebRootPath,
                        "uploads",
                        "realisations"
                    );
                    Directory.CreateDirectory(uploadsFolder);

                    // Générer un nom de fichier unique
                    var uniqueFileName = $"{Guid.NewGuid()}_{imageFile.FileName}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    // Sauvegarder le fichier
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await imageFile.CopyToAsync(fileStream);
                    }

                    // Stocker le chemin relatif
                    imagePath = $"/uploads/realisations/{uniqueFileName}";
                }

                // Calcul du montant réel
                var montantreel = bon_dlprixunitaire * bon_dlqte;

                // Mise à jour du BonPrecommande
                existantBonPrecommande.bon_etatid = etat.etatp_id;

                // Création de la réalisation liée
                var realisation = new Realisation
                {
                    real_plannificationid = vBonPrecommande.plan_id,
                    real_daterealisation = DateTime.Now,
                    real_prixunitaire = bon_dlprixunitaire,
                    real_montantreel = montantreel,
                    real_actionid = etatrealisation.etatr_id,
                    real_image = imagePath,
                    real_description = real_description,
                };

                _budgetContext.Realisations.Add(realisation);
                _budgetContext.SaveChanges();

                return Ok(existantBonPrecommande);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erreur: {ex.Message}");
            }
        }
    }
}

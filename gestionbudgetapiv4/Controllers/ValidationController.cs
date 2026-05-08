using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using GESTIONBUDGETAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ValidationController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;
        private readonly IWebHostEnvironment _environment;
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _appContext;
        private readonly ILogger<ValidationController> _logger;

        public ValidationController(
            BudgetContext BudgetContext,
            IWebHostEnvironment environment,
            IEmailService emailService,
            ApplicationDbContext appContext,
            ILogger<ValidationController> logger
        )
        {
            _budgetContext = BudgetContext;
            _environment = environment;
            _emailService = emailService;
            _appContext = appContext;
            _logger = logger;
        }

        [HttpPut("{id:int}/validationcg")]
        public ActionResult<Plannification> ValidationControllerGestion(
            int id,
            [FromBody] Plannification plannification
        )
        {
            var existingPlannification = _budgetContext.Plannifications.Find(id);
            var etat = _budgetContext.Etats.FirstOrDefault(e => e.etat_name == "a validé");

            if (etat == null)
                return BadRequest("L'état 'a validé' n'existe pas dans la base.");

            if (existingPlannification == null)
                return NotFound($"Plannification avec ID {id} introuvable.");

            existingPlannification.plan_etatactionid = etat.etat_id;
            _budgetContext.SaveChanges();

            return Ok(existingPlannification);
        }

        [HttpPut("validationdirection/{id:int}")]
        public ActionResult ValidationDirection(int id)
        {
            var existingPlannification = _budgetContext.Plannifications.Find(id);
            var etat = _budgetContext.Etats.FirstOrDefault(e => e.etat_name == "validé");

            if (existingPlannification == null)
                return NotFound($"Plannification avec ID {id} introuvable.");

            if (etat == null)
                return BadRequest("L'état 'validé' n'existe pas dans la base.");

            // Mettre l'état à "validé"
            existingPlannification.plan_etatactionid = etat.etat_id;
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

                var real_description = form["real_description"].ToString() ?? string.Empty;
                var imageFile = form.Files.GetFile("real_image");

                // CORRECTION: Chercher par bon_id dans V_BonPrecommandes
                var vBonPrecommande = _budgetContext.V_BonPrecommandes.FirstOrDefault(v =>
                    v.bon_id == id
                );

                if (vBonPrecommande == null)
                    return NotFound($"BonPrecommande avec bon_id {id} introuvable.");

                // Récupérer le BonPrecommande correspondant via bon_id
                var existantBonPrecommande = _budgetContext.BonPrecommandes.Find(
                    vBonPrecommande.bon_id
                );

                if (existantBonPrecommande is null)
                    return NotFound(
                        $"BonPrecommande avec bon_id {vBonPrecommande.bon_id} introuvable."
                    );

                // Récupération des états nécessaires
                var etat = _budgetContext.Etats.FirstOrDefault(e => e.etat_name == "validé");
                var etatnonvalide = _budgetContext.Etats.FirstOrDefault(e =>
                    e.etat_name == "non validé"
                );

                if (etat is null)
                    return BadRequest("L'état requis ('validé') n'existe pas dans la base.");

                if (etatnonvalide is null)
                    return BadRequest("L'état requis ('non validé') n'existe pas dans la base.");

                // 🔧 CORRECTION: Utiliser les valeurs du bon de précommande depuis la base de données
                decimal bon_dlprixunitaire = vBonPrecommande.bon_dlprixunitaire ?? 0;
                int bon_dlqte = vBonPrecommande.bon_dlqte ?? 0;

                // Vérification des champs obligatoires
                if (bon_dlprixunitaire <= 0 || bon_dlqte <= 0)
                    return BadRequest(
                        $"Prix unitaire ou quantité invalides dans le bon de précommande. Prix: {bon_dlprixunitaire}, Qté: {bon_dlqte}"
                    );

                // 🔧 La description est maintenant optionnelle (par défaut chaîne vide)
                real_description = real_description ?? string.Empty;

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

                // 🔧 CORRECTION: Utiliser le montant HT du bon de précommande (pas le calcul)
                var montantreel = vBonPrecommande.bon_dlmontantht ?? 0;

                // Mise à jour du BonPrecommande
                existantBonPrecommande.bon_etatid = etat.etat_id;
                _budgetContext.SaveChanges();

                // 🔧 CORRECTION: Création de la réalisation avec les montants du bon de précommande
                var realisation = new Realisation
                {
                    real_plannificationid = vBonPrecommande.plan_id,
                    real_daterealisation = DateTime.Now,
                    real_prixunitaire = bon_dlprixunitaire,
                    real_montantreel = montantreel,
                    real_actionid = etatnonvalide.etat_id,
                    real_image = imagePath,
                    real_description = real_description,
                };

                _budgetContext.Realisations.Add(realisation);
                _budgetContext.SaveChanges();

                // 📧 ENVOI AUTOMATIQUE DE L'EMAIL AVEC LES BONNES VALEURS
                try
                {
                    // Récupérer l'utilisateur qui a créé le bon
                    var createur = await _appContext.Users.FirstOrDefaultAsync(u =>
                        u.user_id == vBonPrecommande.plan_createdby
                    );

                    // Récupérer le produit
                    var produit = await _budgetContext.Produits.FirstOrDefaultAsync(p =>
                        p.prod_id == vBonPrecommande.plan_produitid
                    );

                    // Paramètres pour l'email avec les VRAIES valeurs du bon
                    var emailParameters = new Dictionary<string, string>
                    {
                        { "userName", createur?.user_name ?? "Utilisateur" },
                        { "departement", vBonPrecommande.dept_name ?? "Département" },
                        { "validateur", User?.Identity?.Name ?? "Administrateur" },
                        { "date", DateTime.Now.ToString("dd/MM/yyyy HH:mm") },
                        {
                            "projet",
                            produit?.prod_name ?? vBonPrecommande.bon_dldesign ?? "Projet"
                        },
                        { "montant", montantreel.ToString("N0") }, // Montant du bon (bon_dlmontantht)
                        { "description", real_description },
                    };

                    // Envoyer l'email
                    await _emailService.SendEmailRealisationValider(
                        "realisation_budget",
                        emailParameters
                    );

                    _logger.LogInformation(
                        "Email d'approbation de réalisation envoyé après validation du bon {BonId}",
                        id
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Erreur lors de l'envoi de l'email après validation du bon {BonId}: {Error}",
                        id,
                        ex.Message
                    );
                    // Ne pas bloquer la réponse si l'email échoue
                }

                return Ok(existantBonPrecommande);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erreur: {ex.Message}");
            }
        }
    }
}

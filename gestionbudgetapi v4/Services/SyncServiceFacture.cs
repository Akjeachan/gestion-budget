using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Services
{
    public class SyncServiceFacture : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SyncServiceFacture> _logger;
        private int _lastSyncedId = 0;

        // 🔧 Constantes pour faciliter la maintenance
        private const int DELAI_SYNC_SECONDES = 10; // Augmenté à 10s pour éviter spam
        private const int DELAI_ERREUR_SECONDES = 30;
        private const int BATCH_SIZE = 50;
        private const string ETAT_NON_VALIDE = "non validé";
        private const string ETAT_EN_COURS = "en cours";

        public SyncServiceFacture(
            IServiceProvider serviceProvider,
            ILogger<SyncServiceFacture> logger
        )
        {
            _serviceProvider =
                serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Service de synchronisation démarré");

            try
            {
                await InitialiserDernierId(stoppingToken);
                _logger.LogInformation($"📊 Dernier ID synchronisé : {_lastSyncedId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "❌ Erreur critique lors de l'initialisation du service de synchronisation"
                );
                return; // Arrêt du service si l'initialisation échoue
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await VerifierEtSynchroniser(stoppingToken);
                    await Task.Delay(TimeSpan.FromSeconds(DELAI_SYNC_SECONDES), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("🛑 Service de synchronisation arrêté");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur lors de la synchronisation");

                    try
                    {
                        await Task.Delay(
                            TimeSpan.FromSeconds(DELAI_ERREUR_SECONDES),
                            stoppingToken
                        );
                    }
                    catch (OperationCanceledException)
                    {
                        _logger.LogInformation(
                            "🛑 Service de synchronisation arrêté pendant le délai d'erreur"
                        );
                        break;
                    }
                }
            }

            _logger.LogInformation("✅ Service de synchronisation terminé proprement");
        }

        /// <summary>
        /// Initialise le dernier ID synchronisé depuis la base de données
        /// </summary>
        private async Task InitialiserDernierId(CancellationToken cancellationToken = default)
        {
            using var scope = _serviceProvider.CreateScope();
            var budgetdb = scope.ServiceProvider.GetRequiredService<BudgetContext>();

            var tracker = await budgetdb
                .SyncTrackers.AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);

            if (tracker != null)
            {
                _lastSyncedId = tracker.LastSyncedId;
                _logger.LogInformation($"📍 Tracker existant trouvé avec ID : {_lastSyncedId}");
            }
            else
            {
                // Première fois : créer le tracker
                var maxId =
                    await budgetdb
                        .BonPrecommandes.AsNoTracking()
                        .MaxAsync(b => (int?)b.bon_id, cancellationToken)
                    ?? 0;

                _lastSyncedId = maxId;

                var nouveauTracker = new Synctracker
                {
                    LastSyncedId = _lastSyncedId,
                    LastSyncDate = DateTime.UtcNow,
                };

                budgetdb.SyncTrackers.Add(nouveauTracker);
                await budgetdb.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    $"📍 Nouveau tracker créé avec ID initial : {_lastSyncedId}"
                );
            }
        }

        /// <summary>
        /// Vérifie et synchronise les nouveaux bons de précommande
        /// </summary>
        private async Task VerifierEtSynchroniser(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var budgetdb = scope.ServiceProvider.GetRequiredService<BudgetContext>();
            var sagedb = scope.ServiceProvider.GetRequiredService<BijouContext>();

            // 1️⃣ Récupérer l'état "non validé" (crée automatiquement s'il n'existe pas)
            var etatNonValide = await budgetdb.Etats.FirstOrDefaultAsync(
                e => e.etat_name == ETAT_NON_VALIDE,
                cancellationToken
            );

            if (etatNonValide == null)
            {
                _logger.LogWarning(
                    "⚠️ État '{EtatName}' introuvable dans la base de données - création automatique",
                    ETAT_NON_VALIDE
                );

                // Créer et persister l'état par défaut
                etatNonValide = new Etat { etat_name = ETAT_NON_VALIDE };
                budgetdb.Etats.Add(etatNonValide);
                await budgetdb.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "✅ État créé automatiquement : {EtatName} (id={EtatId})",
                    etatNonValide.etat_name,
                    etatNonValide.etat_id
                );
            }

            // 1B️⃣ Récupérer l'état "validé" pour les bons après création de réalisation
            var etatValide = await budgetdb.Etats.FirstOrDefaultAsync(
                e => e.etat_name == "validé",
                cancellationToken
            );

            if (etatValide == null)
            {
                _logger.LogWarning("⚠️ État 'validé' introuvable dans la base de données");
                // Continuer sans bloquer - on mettra juste pas à jour l'état du bon
            }

            // 2️⃣ Récupérer les nouveaux bons depuis Sage
            var nouveauxBonsPrecommandeBrut = await RecupererNouveauxBonsSage(
                sagedb,
                cancellationToken
            );

            if (!nouveauxBonsPrecommandeBrut.Any())
            {
                // Mode silencieux quand rien à traiter
                return; // Pas de nouveaux bons
            }

            _logger.LogInformation(
                "🔄 Début synchronisation - {Count} ligne(s) récupérée(s) depuis Sage",
                nouveauxBonsPrecommandeBrut.Count
            );

            // 3️⃣ Dédupliquer les bons
            var bonsDedupliques = DedupliquerBons(nouveauxBonsPrecommandeBrut);

            // 4️⃣ Filtrer les bons déjà existants
            var bonsAAjouter = await FiltrerBonsExistants(
                budgetdb,
                bonsDedupliques,
                etatNonValide,
                cancellationToken
            );

            if (!bonsAAjouter.Any())
            {
                _logger.LogInformation("ℹ️ Tous les bons récupérés existent déjà");
                await MettreAJourTracker(
                    budgetdb,
                    bonsDedupliques.Max(b => Convert.ToInt32(b.cbMarq)),
                    cancellationToken
                );
                return;
            }

            // 5️⃣ Sauvegarder les nouveaux bons + créer réalisations automatiquement
            await SauvegarderBons(
                budgetdb,
                bonsAAjouter,
                etatNonValide,
                etatValide,
                cancellationToken
            );

            // 6️⃣ Mettre à jour le tracker
            var maxIdTraite = bonsAAjouter.Max(b => b.bon_id);
            await MettreAJourTracker(budgetdb, maxIdTraite, cancellationToken);
            _logger.LogInformation(
                "✅ Synchronisation terminée : {Count} bon(s) ajouté(s), tracker mis à jour à {MaxId}",
                bonsAAjouter.Count,
                maxIdTraite
            );
        }

        /// <summary>
        /// Récupère les nouveaux bons de précommande depuis Sage
        /// </summary>
        private async Task<List<BonPrecommandeSageDto>> RecupererNouveauxBonsSage(
            BijouContext sagedb,
            CancellationToken cancellationToken
        )
        {
            // Activation des logs détaillés via variable d'environnement SYNC_DEBUG=true
            bool debugMode = Environment.GetEnvironmentVariable("SYNC_DEBUG") == "true";

            if (debugMode)
            {
                _logger.LogInformation(
                    "🔍 [DEBUG] Début récupération depuis Sage - LastSyncedId = {LastSyncedId}",
                    _lastSyncedId
                );

                // Vérifier d'abord combien de lignes existent dans la vue
                try
                {
                    var totalCount = await sagedb.V_BonPrecommandeSage.CountAsync(
                        cancellationToken
                    );
                    _logger.LogInformation(
                        "📊 [DEBUG] Nombre total de lignes dans V_BonPrecommandeSage: {Total}",
                        totalCount
                    );

                    var countAfterFilter = await sagedb
                        .V_BonPrecommandeSage.Where(f => f.cbMarq > _lastSyncedId)
                        .CountAsync(cancellationToken);
                    _logger.LogInformation(
                        "📊 [DEBUG] Nombre de lignes avec cbMarq > {LastSyncedId}: {Count}",
                        _lastSyncedId,
                        countAfterFilter
                    );

                    if (countAfterFilter == 0)
                    {
                        _logger.LogWarning(
                            "⚠️ [DEBUG] Aucune ligne trouvée dans Sage avec cbMarq > {LastSyncedId}",
                            _lastSyncedId
                        );

                        // Afficher les 5 derniers IDs pour diagnostic
                        var derniersCbMarq = await sagedb
                            .V_BonPrecommandeSage.OrderByDescending(f => f.cbMarq)
                            .Take(5)
                            .Select(f => f.cbMarq)
                            .ToListAsync(cancellationToken);

                        if (derniersCbMarq.Any())
                        {
                            _logger.LogInformation(
                                "📌 [DEBUG] Les 5 derniers cbMarq dans Sage: {Ids}",
                                string.Join(", ", derniersCbMarq)
                            );
                        }
                        else
                        {
                            _logger.LogWarning(
                                "⚠️ [DEBUG] La vue V_BonPrecommandeSage est complètement vide!"
                            );
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur lors de la vérification de la vue Sage");
                }
            }

            // Récupérer les lignes brutes (peut contenir plusieurs lignes par bon si plusieurs articles)
            var rawList = await sagedb
                .V_BonPrecommandeSage.Where(f => f.cbMarq > _lastSyncedId)
                .OrderBy(f => f.cbMarq)
                .Take(BATCH_SIZE)
                .Select(f => new BonPrecommandeSageDto
                {
                    cbMarq = f.cbMarq,
                    AR_Ref = f.AR_Ref ?? string.Empty,
                    DL_Design = f.DL_Design ?? string.Empty,
                    DL_Qte = f.DL_Qte,
                    DL_PrixUnitaire = f.DL_PrixUnitaire,
                    DL_MontantHT = f.DL_MontantHT,
                    DL_MontantTTC = f.DL_MontantTTC,
                    cbCreation = f.cbCreation,
                    DO_Ref = f.DO_Ref ?? string.Empty,
                })
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            // Afficher les IDs récupérés pour diagnostic
            if (rawList.Any())
            {
                var idsRecuperes = rawList
                    .Select(r => r.cbMarq)
                    .Distinct()
                    .OrderBy(x => x)
                    .ToList();
                _logger.LogInformation(
                    "📋 IDs (cbMarq) récupérés depuis Sage: {Ids}",
                    string.Join(", ", idsRecuperes)
                );
                _logger.LogInformation(
                    "📊 Nombre total de lignes brutes: {Count} ligne(s)",
                    rawList.Count
                );
            }

            // Dédupliquer par paire (cbMarq + AR_Ref) pour éviter d'avoir plusieurs lignes
            // pour le même article dans un même bon
            var deduped = rawList
                .GroupBy(x => new { x.cbMarq, x.AR_Ref })
                .Select(g => g.OrderByDescending(x => x.DL_Qte).First())
                .ToList();

            // Log si déduplication effectuée
            if (deduped.Count < rawList.Count)
            {
                _logger.LogInformation(
                    "ℹ️ Déduplication articles/ligne : {Raw} -> {Deduped} ligne(s)",
                    rawList.Count,
                    deduped.Count
                );
            }

            return deduped;
        }

        /// <summary>
        /// Déduplique les bons par cbMarq
        /// </summary>
        private List<BonPrecommandeSageDto> DedupliquerBons(List<BonPrecommandeSageDto> bons)
        {
            // ATTENTION: Cette méthode garde UN SEUL bon par cbMarq
            // Si vous avez plusieurs articles pour un même bon, vous perdez les autres!

            var idsAvant = bons.Select(b => b.cbMarq).ToList();
            var bonsDedupliques = bons.GroupBy(b => b.cbMarq).Select(g => g.First()).ToList();

            // Log uniquement si des doublons ont été trouvés
            if (bonsDedupliques.Count < bons.Count)
            {
                _logger.LogWarning(
                    "⚠️ ATTENTION: Déduplication par cbMarq réduit {Original} -> {Unique} bon(s)",
                    bons.Count,
                    bonsDedupliques.Count
                );
                _logger.LogWarning(
                    "⚠️ Si un bon a plusieurs articles, seul le premier est conservé!"
                );
            }

            return bonsDedupliques;
        }

        /// <summary>
        /// Filtre les bons qui n'existent pas déjà en base de données
        /// </summary>
        private async Task<List<BonPrecommande>> FiltrerBonsExistants(
            BudgetContext budgetdb,
            List<BonPrecommandeSageDto> bonsSage,
            Etat etat,
            CancellationToken cancellationToken
        )
        {
            // Convertir les IDs en int
            var bonIds = bonsSage.Select(b => Convert.ToInt32(b.cbMarq)).ToList();

            // Récupérer tous les IDs existants en une seule requête
            var idsExistants = await budgetdb
                .BonPrecommandes.AsNoTracking()
                .Where(b => bonIds.Contains(b.bon_id))
                .Select(b => b.bon_id)
                .ToListAsync(cancellationToken);

            var idsExistantsSet = new HashSet<int>(idsExistants);

            // Préparer les bons à ajouter
            var bonsAAjouter = new List<BonPrecommande>();

            _logger.LogInformation(
                "🔍 Filtrage: {Total} bon(s) à vérifier, {Existants} déjà en base",
                bonsSage.Count,
                idsExistants.Count
            );

            foreach (var bonSage in bonsSage)
            {
                try
                {
                    int bonId = Convert.ToInt32(bonSage.cbMarq);

                    // Vérification ultra-rapide avec HashSet
                    if (!idsExistantsSet.Contains(bonId))
                    {
                        var nouvelObjet = new BonPrecommande
                        {
                            bon_id = bonId,
                            bon_arref = bonSage.AR_Ref,
                            bon_dldesign = bonSage.DL_Design,
                            bon_dlqte = Convert.ToInt32(bonSage.DL_Qte),
                            bon_dlprixunitaire = bonSage.DL_PrixUnitaire,
                            bon_dlmontantht = bonSage.DL_MontantHT,
                            bon_dlmontantttc = bonSage.DL_MontantTTC,
                            bon_cbcreation = bonSage.cbCreation,
                            bon_etatid = etat.etat_id,
                            bon_doref = bonSage.DO_Ref,
                        };

                        bonsAAjouter.Add(nouvelObjet);
                        _logger.LogInformation(
                            $"✅ Bon de précommande {bonId} - {bonSage.DL_Design} préparé pour synchronisation"
                        );
                    }
                    else
                    {
                        _logger.LogInformation(
                            "⏭️ Bon {BonId} ({Design}) déjà existant, ignoré",
                            bonId,
                            bonSage.DL_Design
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"❌ Erreur lors du traitement du bon {bonSage.cbMarq}");
                }
            }

            return bonsAAjouter;
        }

        /// <summary>
        /// Sauvegarde les bons en base de données + crée les réalisations automatiquement
        /// </summary>
        private async Task SauvegarderBons(
            BudgetContext budgetdb,
            List<BonPrecommande> bonsAAjouter,
            Etat etatNonValide,
            Etat? etatValide,
            CancellationToken cancellationToken
        )
        {
            try
            {
                budgetdb.BonPrecommandes.AddRange(bonsAAjouter);
                await budgetdb.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"💾 {bonsAAjouter.Count} bon(s) sauvegardé(s) avec succès");

                // 🚀 Créer automatiquement les réalisations après l'insertion des bons
                await CreerRealisationsAutomatiques(
                    budgetdb,
                    bonsAAjouter,
                    etatNonValide,
                    etatValide,
                    cancellationToken
                );
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(
                    ex,
                    "❌ Erreur lors de la sauvegarde groupée, tentative de sauvegarde individuelle..."
                );
                await SauvegarderBonsIndividuellement(
                    bonsAAjouter,
                    etatNonValide,
                    etatValide,
                    cancellationToken
                );
            }
        }

        /// <summary>
        /// Sauvegarde les bons individuellement en cas d'erreur lors de la sauvegarde groupée
        /// </summary>
        private async Task SauvegarderBonsIndividuellement(
            List<BonPrecommande> bons,
            Etat etatNonValide,
            Etat? etatValide,
            CancellationToken cancellationToken
        )
        {
            int successCount = 0;
            int errorCount = 0;
            var bonsInseres = new List<BonPrecommande>();

            foreach (var bon in bons)
            {
                try
                {
                    using var scopeIndividuel = _serviceProvider.CreateScope();
                    var budgetdbIndividuel =
                        scopeIndividuel.ServiceProvider.GetRequiredService<BudgetContext>();

                    var dejaExiste = await budgetdbIndividuel
                        .BonPrecommandes.AsNoTracking()
                        .AnyAsync(b => b.bon_id == bon.bon_id, cancellationToken);

                    if (!dejaExiste)
                    {
                        budgetdbIndividuel.BonPrecommandes.Add(bon);
                        await budgetdbIndividuel.SaveChangesAsync(cancellationToken);
                        _logger.LogInformation($"✅ Bon {bon.bon_id} sauvegardé individuellement");
                        bonsInseres.Add(bon);
                        successCount++;
                    }
                    else
                    {
                        _logger.LogWarning(
                            $"⚠️ Bon {bon.bon_id} existe déjà (race condition détectée)"
                        );
                    }
                }
                catch (Exception exIndividuel)
                {
                    _logger.LogError(
                        exIndividuel,
                        $"❌ Impossible de sauvegarder le bon {bon.bon_id}"
                    );
                    errorCount++;
                }
            }

            _logger.LogInformation(
                $"📊 Sauvegarde individuelle terminée : {successCount} succès, {errorCount} erreurs"
            );

            // 🚀 Créer automatiquement les réalisations pour les bons insérés
            if (bonsInseres.Any())
            {
                using var scopeFinal = _serviceProvider.CreateScope();
                var budgetdbFinal = scopeFinal.ServiceProvider.GetRequiredService<BudgetContext>();
                await CreerRealisationsAutomatiques(
                    budgetdbFinal,
                    bonsInseres,
                    etatNonValide,
                    etatValide,
                    cancellationToken
                );
            }
        }

        /// <summary>
        /// 🚀 Crée automatiquement les réalisations après synchronisation des bons
        /// </summary>
        private async Task CreerRealisationsAutomatiques(
            BudgetContext budgetdb,
            List<BonPrecommande> bons,
            Etat etatNonValide,
            Etat? etatValide,
            CancellationToken cancellationToken
        )
        {
            try
            {
                _logger.LogInformation(
                    $"🚀 Création automatique de {bons.Count} réalisation(s)..."
                );

                var realisations = new List<Realisation>();
                var bonIds = bons.Select(b => b.bon_id).ToList();

                // Récupérer les infos des bons depuis V_BonPrecommande pour avoir plan_id
                var vBonPrecommandes = await budgetdb
                    .V_BonPrecommandes.AsNoTracking()
                    .Where(v => bonIds.Contains(v.bon_id))
                    .ToListAsync(cancellationToken);

                foreach (var vBon in vBonPrecommandes)
                {
                    try
                    {
                        if (vBon.plan_id <= 0)
                        {
                            _logger.LogWarning(
                                $"⚠️ Impossible de créer réalisation pour bon {vBon.bon_id} : plan_id introuvable"
                            );
                            continue;
                        }

                        // Créer la réalisation avec les mêmes données que le bon
                        var realisation = new Realisation
                        {
                            real_plannificationid = vBon.plan_id,
                            real_daterealisation = DateTime.Now,
                            real_prixunitaire = vBon.bon_dlprixunitaire ?? 0,
                            real_montantreel = vBon.bon_dlmontantht ?? 0,
                            real_actionid = etatNonValide.etat_id,
                            real_description =
                                $"Automatique depuis Sage - Bon #{vBon.bon_id}: {vBon.bon_dldesign}",
                            real_image = null, // Image null au départ (optionnelle)
                        };

                        realisations.Add(realisation);
                        _logger.LogInformation(
                            $"✅ Réalisation pour bon {vBon.bon_id} préparée automatiquement"
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(
                            ex,
                            $"❌ Erreur lors de la création de réalisation pour bon {vBon.bon_id}"
                        );
                    }
                }

                // Insérer toutes les réalisations
                if (realisations.Any())
                {
                    budgetdb.Realisations.AddRange(realisations);
                    await budgetdb.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation(
                        $"💾 {realisations.Count} réalisation(s) créée(s) et sauvegardée(s)"
                    );

                    // 🔧 Mettre à jour l'état des bons à "validé" (seulement si etatValide existe)
                    if (etatValide != null)
                    {
                        var bonsAMettre = await budgetdb
                            .BonPrecommandes.Where(b => bonIds.Contains(b.bon_id))
                            .ToListAsync(cancellationToken);

                        foreach (var bon in bonsAMettre)
                        {
                            bon.bon_etatid = etatValide.etat_id;
                        }

                        await budgetdb.SaveChangesAsync(cancellationToken);
                        _logger.LogInformation(
                            $"✅ {bonsAMettre.Count} bon(s) mis à jour avec état 'validé'"
                        );
                    }

                    // 📧 Envoyer les emails automatiquement
                    await EnvoyerEmailsRealisations(budgetdb, vBonPrecommandes, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "❌ Erreur critique lors de la création automatique des réalisations"
                );
            }
        }

        /// <summary>
        /// 📧 Envoie les emails pour les réalisations créées automatiquement
        /// </summary>
        private async Task EnvoyerEmailsRealisations(
            BudgetContext budgetdb,
            List<V_BonPrecommande> vBonPrecommandes,
            CancellationToken cancellationToken
        )
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var appContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                foreach (var vBon in vBonPrecommandes)
                {
                    try
                    {
                        if (vBon.plan_createdby == null || vBon.plan_createdby <= 0)
                            continue;

                        // Récupérer le créateur du planning
                        var createur = await appContext.Users.FirstOrDefaultAsync(
                            u => u.user_id == vBon.plan_createdby,
                            cancellationToken
                        );

                        // Préparer les paramètres d'email
                        var emailParameters = new Dictionary<string, string>
                        {
                            { "userName", createur?.user_name ?? "Utilisateur" },
                            { "departement", vBon.dept_name ?? "Département" },
                            { "validateur", "Système (Synchronisation Sage)" },
                            { "date", DateTime.Now.ToString("dd/MM/yyyy HH:mm") },
                            { "projet", vBon.prod_name ?? vBon.bon_dldesign ?? "Projet" },
                            { "montant", (vBon.bon_dlmontantht ?? 0).ToString("N0") },
                            { "description", $"Automatique depuis Sage - {vBon.bon_dldesign}" },
                        };

                        // Envoyer l'email
                        await emailService.SendEmailRealisationValider(
                            "realisation_budget",
                            emailParameters
                        );

                        _logger.LogInformation(
                            $"📧 Email envoyé automatiquement pour bon {vBon.bon_id}"
                        );
                    }
                    catch (Exception exEmail)
                    {
                        _logger.LogWarning(
                            exEmail,
                            $"⚠️ Erreur lors de l'envoi d'email pour bon {vBon.bon_id} (ne bloque pas la sync)"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors de l'envoi des emails (ne bloque pas la sync)");
            }
        }

        /// <summary>
        /// Met à jour le tracker avec le dernier ID synchronisé
        /// </summary>
        private async Task MettreAJourTracker(
            BudgetContext budgetdb,
            int maxIdTraite,
            CancellationToken cancellationToken
        )
        {
            _lastSyncedId = maxIdTraite;

            var tracker = await budgetdb.SyncTrackers.FirstOrDefaultAsync(cancellationToken);

            if (tracker != null)
            {
                tracker.LastSyncedId = _lastSyncedId;
                tracker.LastSyncDate = DateTime.UtcNow;
                await budgetdb.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"📊 Tracker mis à jour : LastSyncedId = {_lastSyncedId}");
            }
            else
            {
                _logger.LogWarning("⚠️ Tracker introuvable lors de la mise à jour");
            }
        }
    }

    /// <summary>
    /// DTO pour transférer les données depuis Sage
    /// </summary>
    internal class FactureSage
    {
        public int cbMarq { get; set; }
        public string AR_Ref { get; set; } = string.Empty;
        public string DL_Design { get; set; } = string.Empty;
        public decimal DL_Qte { get; set; }
        public decimal DL_PrixUnitaire { get; set; }
        public decimal DL_MontantHT { get; set; }
        public decimal DL_MontantTTC { get; set; }
        public DateTime cbCreation { get; set; }
        public string DO_Ref { get; set; } = string.Empty;
    }
}

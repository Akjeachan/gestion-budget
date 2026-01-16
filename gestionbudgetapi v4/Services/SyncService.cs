using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Services
{
    public class SyncService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SyncService> _logger;
        private int _lastSyncedId = 0;

        public SyncService(IServiceProvider serviceProvider, ILogger<SyncService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Service de synchronisation démarré");

            await InitialiserDernierId();

            _logger.LogInformation($"📊 Dernier ID synchronisé : {_lastSyncedId}");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await VerifierEtSynchroniser(stoppingToken);
                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur synchronisation");
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
        }

        private async Task InitialiserDernierId()
        {
            using var scope = _serviceProvider.CreateScope();
            var budgetdb = scope.ServiceProvider.GetRequiredService<BudgetContext>();

            var tracker = await budgetdb.SyncTrackers.FirstOrDefaultAsync();

            if (tracker != null)
            {
                _lastSyncedId = tracker.LastSyncedId;
            }
            else
            {
                // Première fois : créer le tracker
                var maxId = await budgetdb.BonPrecommandes.MaxAsync(o => (int?)o.bon_id) ?? 0;
                _lastSyncedId = maxId;

                budgetdb.SyncTrackers.Add(
                    new Synctracker { LastSyncedId = _lastSyncedId, LastSyncDate = DateTime.UtcNow }
                );
                await budgetdb.SaveChangesAsync();
            }
        }

        private async Task VerifierEtSynchroniser(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var budgetdb = scope.ServiceProvider.GetRequiredService<BudgetContext>();
            var sagedb = scope.ServiceProvider.GetRequiredService<BijouContext>();

            var etat = await budgetdb.Etat_Plannifications.FirstOrDefaultAsync(
                e => e.etatp_name == "non validé",
                cancellationToken
            );

            if (etat == null)
            {
                _logger.LogWarning("⚠️ État 'non validé' introuvable");
                return;
            }

            // Récupérer les nouveaux bons depuis Sage avec types decimal
            // Utiliser Select() pour forcer EF à lire les bonnes colonnes
            var nouveauxBonprecommandeBrut = await sagedb
                .V_BonPrecommandeSage.Where(f => f.cbMarq > _lastSyncedId)
                .OrderBy(f => f.cbMarq)
                .Take(50)
                .Select(f => new
                {
                    cbMarq = f.cbMarq, // decimal en base Sage
                    AR_Ref = f.AR_Ref,
                    DL_Design = f.DL_Design,
                    DL_Qte = f.DL_Qte, // decimal en base Sage
                    DL_PrixUnitaire = f.DL_PrixUnitaire,
                    DL_MontantHT = f.DL_MontantHT,
                    DL_MontantTTC = f.DL_MontantTTC,
                    cbCreation = f.cbCreation,
                    DO_Ref = f.DO_Ref,
                })
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            if (nouveauxBonprecommandeBrut.Any())
            {
                _logger.LogInformation(
                    $"🔔 {nouveauxBonprecommandeBrut.Count} nouveau(x) Bon de Commande(s) détecté(s)"
                );

                foreach (var bonSage in nouveauxBonprecommandeBrut)
                {
                    try
                    {
                        // Convertir decimal vers int pour la base Budget
                        int bonId = bonSage.cbMarq;
                        int bonQte = Convert.ToInt32(bonSage.DL_Qte);

                        // Vérifier si le bon existe déjà dans budget
                        var existe = await budgetdb.BonPrecommandes.AnyAsync(
                            o => o.bon_id == bonId,
                            cancellationToken
                        );

                        if (!existe)
                        {
                            // Créer un nouveau BonPrecommande avec conversion
                            var nouvelObjet = new BonPrecommande
                            {
                                bon_id = bonId, // int (converti depuis decimal)
                                bon_arref = bonSage.AR_Ref,
                                bon_dldesign = bonSage.DL_Design,
                                bon_dlqte = bonQte, // int (converti depuis decimal)
                                bon_dlprixunitaire = bonSage.DL_PrixUnitaire,
                                bon_dlmontantht = bonSage.DL_MontantHT,
                                bon_dlmontantttc = bonSage.DL_MontantTTC,
                                bon_cbcreation = bonSage.cbCreation,
                                bon_etatid = etat.etatp_id,
                                bon_doref = bonSage.DO_Ref,
                            };

                            budgetdb.BonPrecommandes.Add(nouvelObjet);
                            _logger.LogInformation(
                                $"✅ Bon de précommande {bonId} - {bonSage.DL_Design} synchronisé"
                            );
                        }

                        // Mettre à jour le dernier ID (en int)
                        _lastSyncedId = bonId;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"❌ Erreur bon précommande {bonSage.cbMarq}");
                    }
                }

                await budgetdb.SaveChangesAsync(cancellationToken);

                // Mettre à jour le tracker
                var tracker = await budgetdb.SyncTrackers.FirstOrDefaultAsync(cancellationToken);
                if (tracker != null)
                {
                    tracker.LastSyncedId = _lastSyncedId;
                    tracker.LastSyncDate = DateTime.UtcNow;
                    await budgetdb.SaveChangesAsync(cancellationToken);
                }
            }
        }
    }
}

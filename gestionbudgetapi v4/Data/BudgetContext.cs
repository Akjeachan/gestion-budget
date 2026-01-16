using GESTIONBUDGETAPI.Module;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Data
{
    public class BudgetContext : DbContext
    {
        public BudgetContext(DbContextOptions<BudgetContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Types> Types { get; set; }
        public DbSet<Plannification> Plannifications { get; set; }
        public DbSet<Etat_Plannification> Etat_Plannifications { get; set; }
        public DbSet<Produit> Produits { get; set; }
        public DbSet<Realisation> Realisations { get; set; }
        public DbSet<Etat_Realisation> Etat_Realisations { get; set; }
        public DbSet<v_Plannification> v_Plannifications { get; set; }
        public DbSet<Budget> Budgets { get; set; }
        public DbSet<Numero_compte> Numero_comptes { get; set; }
        public DbSet<Departement> Departements { get; set; }
        public DbSet<Reaffectation> Reaffectations { get; set; }
        public DbSet<BonPrecommande> BonPrecommandes { get; set; }
        public DbSet<Synctracker> SyncTrackers { get; set; }
        public DbSet<V_BonPrecommande> V_BonPrecommandes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Plannification>().ToTable(tb => tb.UseSqlOutputClause(false));
            modelBuilder.Entity<BonPrecommande>(entity =>
            {
                entity.HasKey(e => e.bon_id);
                entity.ToTable("bonprecommande");

                // ⬇️ IMPORTANT : Désactiver l'auto-incrémentation pour prod_id
                entity.Property(e => e.bon_id).ValueGeneratedNever(); // Permet d'insérer des valeurs explicites
            });

            modelBuilder.Entity<Synctracker>(entity =>
            {
                entity.HasKey(e => e.id);
                entity.ToTable("SyncTracker");
            });
        }
    }
}

using GESTIONBUDGETAPI.Module;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Data
{
    public class CrmTestContext : DbContext
    {
        public CrmTestContext(DbContextOptions<CrmTestContext> options)
            : base(options) { }

        public DbSet<ProduitCrmTest> Produits { get; set; }
        public DbSet<Synctracker> SyncTrackers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ProduitCrmTest>(entity =>
            {
                entity.HasKey(e => e.prod_id);
                entity.ToTable("produit");

                // ⬇️ IMPORTANT : Désactiver l'auto-incrémentation pour prod_id
                entity.Property(e => e.prod_id).ValueGeneratedNever(); // Permet d'insérer des valeurs explicites
            });

            modelBuilder.Entity<Synctracker>(entity =>
            {
                entity.HasKey(e => e.id);
                entity.ToTable("SyncTracker");
            });
        }
    }
}

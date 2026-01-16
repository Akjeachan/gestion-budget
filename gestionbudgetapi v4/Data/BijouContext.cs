using GESTIONBUDGETAPI.Module;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Data
{
    public class BijouContext : DbContext
    {
        public BijouContext(DbContextOptions<BijouContext> options)
            : base(options) { }

        public DbSet<V_BonPrecommandeSage> V_BonPrecommandeSage { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Forcer le mapping vers la vue V_BonPrecommande
            modelBuilder
                .Entity<V_BonPrecommandeSage>()
                .ToTable("V_BonPrecommande")
                .HasKey(v => v.cbMarq);

            base.OnModelCreating(modelBuilder);
        }
    }
}

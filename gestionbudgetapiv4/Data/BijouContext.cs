using GESTIONBUDGETAPI.Module;
using Microsoft.EntityFrameworkCore;

namespace GESTIONBUDGETAPI.Data
{
    public class BijouContext : DbContext
    {
        public BijouContext(DbContextOptions<BijouContext> options)
            : base(options) { }

        public DbSet<V_BonPrecommandeSage> V_BonPrecommandeSage { get; set; }
        public DbSet<Article> Articles { get; set; }
        public DbSet<BonCommandeSage> BonCommandeSages { get; set; }
        public DbSet<FactureSage> FactureSages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Forcer le mapping vers la vue V_BonPrecommande
            modelBuilder
                .Entity<V_BonPrecommandeSage>()
                .ToTable("V_BonPrecommande")
                .HasKey(v => v.cbMarq);

            // Configuration des decimal pour V_BonPrecommandeSage
            modelBuilder
                .Entity<V_BonPrecommandeSage>()
                .Property(v => v.DL_Qte)
                .HasPrecision(18, 6);
            modelBuilder
                .Entity<V_BonPrecommandeSage>()
                .Property(v => v.DL_PrixUnitaire)
                .HasPrecision(18, 6);
            modelBuilder
                .Entity<V_BonPrecommandeSage>()
                .Property(v => v.DL_MontantHT)
                .HasPrecision(18, 6);
            modelBuilder
                .Entity<V_BonPrecommandeSage>()
                .Property(v => v.DL_MontantTTC)
                .HasPrecision(18, 6);

            // Configuration des decimal pour Article
            modelBuilder.Entity<Article>().Property(a => a.AR_PrixAch).HasPrecision(18, 6);
            modelBuilder.Entity<Article>().Property(a => a.AR_PrixVen).HasPrecision(18, 6);
            modelBuilder.Entity<Article>().Property(a => a.AR_Coef).HasPrecision(18, 6);
            modelBuilder.Entity<Article>().Property(a => a.AR_PoidsBrut).HasPrecision(18, 6);
            modelBuilder.Entity<Article>().Property(a => a.AR_PoidsNet).HasPrecision(18, 6);
            modelBuilder.Entity<Article>().Property(a => a.ObjectifQtesVendues).HasPrecision(18, 6);
            modelBuilder
                .Entity<Article>()
                .Property(a => a.PourcentageTeneurEnOr)
                .HasPrecision(18, 6);

            base.OnModelCreating(modelBuilder);
        }
    }
}

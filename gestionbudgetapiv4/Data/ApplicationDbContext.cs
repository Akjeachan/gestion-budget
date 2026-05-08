using Microsoft.EntityFrameworkCore;
using GESTIONBUDGETAPI.Module;

namespace GESTIONBUDGETAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Si vous avez déjà une table Users dans votre base
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuration de la table Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users"); // Nom de votre table existante
                entity.HasKey(e => e.user_id);
                entity.Property(e => e.user_name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.user_identifiant).IsRequired().HasMaxLength(200);
                entity.HasIndex(e => e.user_identifiant).IsUnique();
            });
        }
    }
}
using System.Text;
using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Services;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// OPEN API + CORS
// ============================================================

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
    );
});

// ============================================================
// DATABASES
// ============================================================

builder.Services.AddDbContext<BijouContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("BijouDb"))
);

builder.Services.AddDbContext<BudgetContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("BudgetDb"))
);

// 🆕 ApplicationDbContext pour les utilisateurs (utilise la même base que BudgetDb)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("BudgetDb"))
);

// ============================================================
// 🆕 SERVICE DE SYNCHRONISATION
// ============================================================

builder.Services.AddHostedService<SyncService>();

// ============================================================
// 📧 SERVICES EMAIL (NOUVEAU)
// ============================================================

// Configuration EmailSettings depuis appsettings.json
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));

// Enregistrer les services d'email
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ITemplateService, TemplateService>();

// ============================================================
// 📦 SERVICES METIER
// ============================================================

builder.Services.AddScoped<IArticleService, ArticleService>();

// ============================================================
// CONFIG UPLOAD FILES
// ============================================================

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100 MB
    options.ValueLengthLimit = 104857600;
    options.MultipartHeadersLengthLimit = 104857600;
});

// ============================================================
// 🔐 JWT CONFIGURATION
// ============================================================

var jwtKey = builder.Configuration["Jwt:Key"] ?? "CLE_SUPER_SECRETE_123456";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "GESTIONBUDGETAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "GESTIONBUDGETCLIENT";

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<JwtService>();

// ============================================================
// CONTROLLERS
// ============================================================

builder.Services.AddControllers();

var app = builder.Build();

// ============================================================
// 🆕 INITIALISATION AU DÉMARRAGE
// ============================================================

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("🔄 Initialisation...");

        var budgetDb = services.GetRequiredService<BudgetContext>();
        if (await budgetDb.Database.CanConnectAsync())
        {
            if (!await budgetDb.SyncTrackers.AnyAsync())
            {
                logger.LogInformation("🆕 Création du tracker pour BonPrecommandes...");

                var maxId = await budgetDb.BonPrecommandes.MaxAsync(b => (int?)b.bon_id) ?? 0;

                budgetDb.SyncTrackers.Add(
                    new GESTIONBUDGETAPI.Module.Synctracker
                    {
                        LastSyncedId = maxId,
                        LastSyncDate = DateTime.UtcNow,
                    }
                );

                await budgetDb.SaveChangesAsync();
                logger.LogInformation($"✅ Tracker créé (ID: {maxId})");
            }

            var bonCount = await budgetDb.BonPrecommandes.CountAsync();
            logger.LogInformation($"✅ BudgetDb OK ({bonCount} BonPrecommandes)");
        }

        var bijouDb = services.GetRequiredService<BijouContext>();
        if (await bijouDb.Database.CanConnectAsync())
        {
            try
            {
                var vBonCount = await bijouDb.V_BonPrecommandeSage.CountAsync();
                logger.LogInformation($"✅ BijouDb OK ({vBonCount} V_BonPrecommandeSage)");
            }
            catch (Exception ex)
            {
                logger.LogWarning(
                    $"⚠️ BijouDb connecté mais V_BonPrecommandeSage inaccessible: {ex.Message}"
                );
            }
        }

        // 🆕 Vérifier ApplicationDbContext
        try
        {
            var appDb = services.GetRequiredService<ApplicationDbContext>();
            if (await appDb.Database.CanConnectAsync())
            {
                var userCount = await appDb.Users.CountAsync();
                logger.LogInformation($"✅ ApplicationDb OK ({userCount} utilisateurs)");
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning($"⚠️ ApplicationDb: {ex.Message}");
        }

        var etat = await budgetDb.Etats.FirstOrDefaultAsync(e =>
            e.etat_name == "non validé"
        );

        if (etat == null)
        {
            logger.LogWarning("⚠️ État 'non validé' non trouvé dans Etat_Plannifications");
        }
        else
        {
            logger.LogInformation($"✅ État 'non validé' trouvé (ID: {etat.etat_id})");
        }

        // ============================================================
        // 📧 VÉRIFICATION CONFIGURATION EMAIL (NOUVEAU)
        // ============================================================
        try
        {
            var emailSettings = services.GetRequiredService<Microsoft.Extensions.Options.IOptions<EmailSettings>>().Value;
            logger.LogInformation("📧 Configuration Email:");
            logger.LogInformation($"   📬 SMTP Server: {emailSettings.SmtpServer}:{emailSettings.SmtpPort}");
            logger.LogInformation($"   📨 Sender: {emailSettings.SenderName} <{emailSettings.SenderEmail}>");
            logger.LogInformation($"   🔐 SSL: {(emailSettings.UseSsl ? "Activé" : "Désactivé")}");

            // Vérifier si le dossier des templates existe
            var webHostEnv = services.GetRequiredService<IWebHostEnvironment>();
            var templatesPath = Path.Combine(webHostEnv.WebRootPath, "email-templates");
            
            if (Directory.Exists(templatesPath))
            {
                var templates = Directory.GetFiles(templatesPath, "*.html");
                logger.LogInformation($"   📄 Templates trouvés: {templates.Length}");
                foreach (var template in templates)
                {
                    logger.LogInformation($"      - {Path.GetFileName(template)}");
                }
            }
            else
            {
                logger.LogWarning($"   ⚠️ Dossier templates non trouvé: {templatesPath}");
                logger.LogWarning("   💡 Créez le dossier: wwwroot/email-templates/");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Erreur vérification configuration email");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Erreur initialisation");
    }
}

// ============================================================
// PIPELINE HTTP
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ✅ IMPORTANT: Activer les fichiers statiques pour les templates email
app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication(); // 🔐 JWT
app.UseAuthorization();

app.MapControllers();

// ============================================================
// TEST ENDPOINT
// ============================================================

var summaries = new[]
{
    "Freezing",
    "Bracing",
    "Chilly",
    "Cool",
    "Mild",
    "Warm",
    "Balmy",
    "Hot",
    "Sweltering",
    "Scorching",
};

app.MapGet(
        "/weatherforecast",
        () =>
        {
            var forecast = Enumerable
                .Range(1, 5)
                .Select(index => new WeatherForecast(
                    DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    summaries[Random.Shared.Next(summaries.Length)]
                ))
                .ToArray();
            return forecast;
        }
    )
    .WithName("GetWeatherForecast");

// ============================================================
// 📧 TEST ENDPOINT EMAIL (NOUVEAU - OPTIONNEL)
// ============================================================

app.MapGet(
        "/test-email",
        async (IEmailService emailService, ILogger<Program> logger) =>
        {
            try
            {
                logger.LogInformation("📧 Test d'envoi d'email...");

                await emailService.SendEmailAsync(
                    "test@example.com",
                    "Test Email",
                    "<h1>Email de test</h1><p>Ceci est un email de test envoyé depuis GESTION BUDGET API.</p>",
                    true
                );

                logger.LogInformation("✅ Email de test envoyé avec succès");
                return Results.Ok(new { success = true, message = "Email envoyé avec succès" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Erreur envoi email de test");
                return Results.Problem($"Erreur: {ex.Message}");
            }
        }
    )
    .WithName("TestEmail");

// ============================================================
// LOG STARTUP
// ============================================================

var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
startupLogger.LogInformation("╔═══════════════════════════════════════╗");
startupLogger.LogInformation("║  GESTION BUDGET API - SYNC ACTIVE     ║");
startupLogger.LogInformation("║  📧 EMAIL SERVICE ENABLED             ║");
startupLogger.LogInformation("╚═══════════════════════════════════════╝");
startupLogger.LogInformation("📊 BijouDb (Sage) → BudgetDb (2 sec)");
startupLogger.LogInformation("🔄 Synchronisation BonPrecommandes...");
startupLogger.LogInformation("📧 Service d'envoi d'email activé");

app.Run();

// ============================================================
// RECORD
// ============================================================

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
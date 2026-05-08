using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using GESTIONBUDGETAPI.Module.Dto;
using GESTIONBUDGETAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthentificationController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;
        private readonly JwtService _jwtService;

        public AuthentificationController(BudgetContext budgetContext, JwtService jwtService)
        {
            _budgetContext = budgetContext;
            _jwtService = jwtService;
        }

        [HttpPost("login")]
        public IActionResult Authentificationutilisateur([FromBody] LoginDto login)
        {
            try
            {
                // ✅ Validation des entrées
                if (
                    string.IsNullOrWhiteSpace(login.user_identifiant)
                    || string.IsNullOrWhiteSpace(login.user_password)
                )
                {
                    return BadRequest(new { message = "Identifiant et mot de passe sont requis." });
                }

                // ✅ Recherche de l'utilisateur
                var existingUtilisateur = _budgetContext.Users.FirstOrDefault(u =>
                    u.user_identifiant == login.user_identifiant
                );

                if (existingUtilisateur == null)
                {
                    return BadRequest(new { message = "Utilisateur non trouvé." });
                }

                // ✅ Vérification sécurisée du mot de passe
                // ⚠️ En production, remplace par BCrypt.Net.BCrypt.Verify()
                if (
                    existingUtilisateur.user_password == null
                    || existingUtilisateur.user_password != login.user_password
                )
                {
                    return BadRequest(new { message = "Mot de passe incorrect." });
                }

                // ✅ Détermination du rôle avec gestion d'erreur
                string? roleName = existingUtilisateur.user_type switch
                {
                    1 => "Admin",
                    2 => "Utilisateur",
                    _ => null,
                };

                if (roleName == null)
                {
                    return BadRequest(
                        new
                        {
                            message = "Ce type d'utilisateur n'est pas reconnu.",
                            user_type = existingUtilisateur.user_type,
                        }
                    );
                }

                // 🔐 Génération du JWT avec gestion d'erreur
                var token = _jwtService.GenerateToken(existingUtilisateur, roleName);

                return Ok(
                    new
                    {
                        token,
                        user_id = existingUtilisateur.user_id,
                        user_identifiant = existingUtilisateur.user_identifiant,
                        user_name = existingUtilisateur.user_name,
                        role = roleName,
                        user_type = existingUtilisateur.user_type,
                        message = "Connexion réussie",
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                // Erreur de configuration (ex: clé JWT manquante)
                return StatusCode(
                    500,
                    new { message = "Erreur de configuration du serveur", error = ex.Message }
                );
            }
            catch (Exception ex)
            {
                // Autres erreurs inattendues
                return StatusCode(
                    500,
                    new { message = "Erreur lors de l'authentification", error = ex.Message }
                );
            }
        }

        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            try
            {
                // Récupérer l'ID utilisateur depuis le token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Token invalide ou expiré" });
                }

                var user = _budgetContext.Users.FirstOrDefault(u => u.user_id == userId);

                if (user == null)
                {
                    return NotFound(new { message = "Utilisateur non trouvé" });
                }

                string? roleName = user.user_type switch
                {
                    1 => "Admin",
                    2 => "Utilisateur",
                    _ => null,
                };

                return Ok(
                    new
                    {
                        user_id = user.user_id,
                        user_identifiant = user.user_identifiant,
                        user_name = user.user_name,
                        role = roleName,
                        user_type = user.user_type,
                    }
                );
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = "Erreur lors de la récupération des informations",
                        error = ex.Message,
                    }
                );
            }
        }
    }
}

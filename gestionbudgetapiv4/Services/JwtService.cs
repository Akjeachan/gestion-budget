using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GESTIONBUDGETAPI.Module;
using Microsoft.IdentityModel.Tokens;

namespace GESTIONBUDGETAPI.Services
{
    public class JwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user, string roleName)
        {
            // 🔒 Validation des paramètres
            if (user == null)
                throw new ArgumentNullException(
                    nameof(user),
                    "L'utilisateur ne peut pas être null"
                );

            if (string.IsNullOrWhiteSpace(roleName))
                throw new ArgumentException(
                    "Le rôle ne peut pas être null ou vide",
                    nameof(roleName)
                );

            // ✅ Fallback sur identifiant ou nom
            var userName = user.user_identifiant ?? user.user_name ?? $"User_{user.user_id}";

            // ✅ Claims enrichis
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.user_id.ToString()),
                new Claim(ClaimTypes.Name, userName),
                new Claim(ClaimTypes.Role, roleName), // Admin ou Utilisateur
                new Claim("user_type", user.user_type.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            // 🔑 Récupération sécurisée de la clé
            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
                throw new InvalidOperationException(
                    "Clé JWT manquante dans appsettings.json (Jwt:Key)"
                );

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // 🌍 Issuer / Audience avec valeurs par défaut
            var issuer = _configuration["Jwt:Issuer"] ?? "GestionBudgetApi";
            var audience = _configuration["Jwt:Audience"] ?? "GestionBudgetClient";

            // ⏰ Expiration configurable
            var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var minutes)
                ? minutes
                : 60;

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes), // ⚠️ UTC recommandé
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

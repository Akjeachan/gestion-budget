using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("F_ARTICLE")]
    public class Article
    {
        // =========================
        // 🔑 Clé primaire
        // =========================
        [Key]
        [Column("cbMarq")]
        public int cbMarq { get; set; }

        // =========================
        // 🔹 Références article
        // =========================
        [Column("AR_Ref")]
        [StringLength(19)]
        public string? AR_Ref { get; set; }

        [Column("cbAR_Ref")]
        public byte[]? cbAR_Ref { get; set; }

        [Column("AR_Design")]
        [StringLength(69)]
        public string? AR_Design { get; set; }

        [Column("cbAR_Design")]
        public byte[]? cbAR_Design { get; set; }

        [Column("AR_Raccourci")]
        [StringLength(7)]
        public string? AR_Raccourci { get; set; }

        [Column("cbAR_Raccourci")]
        public byte[]? cbAR_Raccourci { get; set; }

        [Column("AR_Substitut")]
        [StringLength(19)]
        public string? AR_Substitut { get; set; }

        [Column("cbAR_Substitut")]
        public byte[]? cbAR_Substitut { get; set; }

        [Column("FA_CodeFamille")]
        [StringLength(11)]
        public string? FA_CodeFamille { get; set; }

        [Column("cbFA_CodeFamille")]
        public byte[]? cbFA_CodeFamille { get; set; }

        // =========================
        // ⚙️ Paramètres article
        // =========================
        public short? AR_Garantie { get; set; }
        public short? AR_SuiviStock { get; set; }
        public short? AR_Nomencl { get; set; }
        public short? AR_Gamme1 { get; set; }
        public short? AR_Gamme2 { get; set; }

        // =========================
        // 🌍 Codes / langues
        // =========================
        [StringLength(69)]
        public string? AR_Langue1 { get; set; }

        [StringLength(69)]
        public string? AR_Langue2 { get; set; }

        [StringLength(45)]
        public string? AR_EdiCode { get; set; }

        public byte[]? cbAR_EdiCode { get; set; }

        [StringLength(19)]
        public string? AR_CodeBarre { get; set; }

        public byte[]? cbAR_CodeBarre { get; set; }

        // =========================
        // 💰 Prix / poids
        // =========================
        public short? AR_UnitePoids { get; set; }
        public decimal? AR_PoidsNet { get; set; }
        public decimal? AR_PoidsBrut { get; set; }

        public short? AR_UniteVen { get; set; }
        public decimal? AR_PrixAch { get; set; }
        public decimal? AR_Coef { get; set; }
        public decimal? AR_PrixVen { get; set; }
        public short? AR_PrixTTC { get; set; }

        // =========================
        // 📦 Délais / type
        // =========================
        public short? AR_Delai { get; set; }
        public short? AR_Type { get; set; }
        public short? AR_Nature { get; set; }

        // =========================
        // 🔗 Comptabilité
        // =========================
        public int? CO_No { get; set; }
        public int? cbCO_No { get; set; }

        // =========================
        // 🛠️ Champs techniques SAGE
        // =========================
        public short? cbProt { get; set; }

        [StringLength(4)]
        public string? cbCreateur { get; set; }

        public DateTime? cbCreation { get; set; }
        public DateTime? cbModification { get; set; }
        public int? cbReplication { get; set; }
        public short? cbFlag { get; set; }
        public Guid? cbCreationUser { get; set; }

        // =========================
        // ⭐ Colonnes spécifiques BIJOU
        // =========================
        [Column("Marque commerciale")]
        [StringLength(35)]
        public string? MarqueCommerciale { get; set; }

        [Column("Objectif / Qtés vendues")]
        public decimal? ObjectifQtesVendues { get; set; }

        [Column("Pourcentage teneur en or")]
        public decimal? PourcentageTeneurEnOr { get; set; }

        [Column("1ère commercialisation")]
        public DateTime? PremiereCommercialisation { get; set; }

        // =========================
        // 🚫 États
        // =========================
        public short? AR_InterdireCommande { get; set; }
        public short? AR_Exclure { get; set; }

        // =========================
        // ✅ Bool calculés
        // =========================
        [NotMapped]
        public bool SuiviStock => AR_SuiviStock == 1;

        [NotMapped]
        public bool InterditCommande => AR_InterdireCommande == 1;

        [NotMapped]
        public bool Exclu => AR_Exclure == 1;
    }
}

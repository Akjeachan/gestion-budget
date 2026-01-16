using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("v_bonprecommande")]
    public class V_BonPrecommande
    {
        [Key]
        public int plan_id { get; set; }

        public DateTime? plan_dateecheance { get; set; }
        public DateTime? plan_dateupdate { get; set; }
        public DateTime? plan_datecreation { get; set; }

        public int? plan_etatactionid { get; set; }
        public int? plan_produitid { get; set; }
        public int? plan_nombredemande { get; set; }
        public decimal? plan_prixunitaire { get; set; }
        public decimal? plan_montanttotal { get; set; }

        public decimal? real_prixunitaire { get; set; }
        public decimal? real_montantreel { get; set; }

        public string? plan_description { get; set; }
        public int? plan_createdby { get; set; }

        public string? prod_name { get; set; }
        public string? dept_name { get; set; }
        public string? real_image { get; set; }

        public int? real_actionid { get; set; }
        public int? real_id { get; set; }

        public int? budget_id { get; set; }
        public string? budget_code { get; set; }
        public int? budget_plannificationid { get; set; }
        public decimal? budget_montant { get; set; }
        public DateTime? budget_datecreation { get; set; }

        public int bon_id { get; set; }
        public string? bon_arref { get; set; }
        public string? bon_dldesign { get; set; }
        public int? bon_dlqte { get; set; }
        public decimal? bon_dlprixunitaire { get; set; }
        public decimal? bon_dlmontantht { get; set; }
        public decimal? bon_dlmontantttc { get; set; }
        public DateTime? bon_cbcreation { get; set; }
        public int? bon_etatid { get; set; }
        public string? bon_doref { get; set; }

        public int? user_id { get; set; }
        public string? user_name { get; set; }
        public string? user_identifiant { get; set; }
        public string? user_password { get; set; }
        public int? user_type { get; set; }
        public int? user_Departementid { get; set; }
    }
}

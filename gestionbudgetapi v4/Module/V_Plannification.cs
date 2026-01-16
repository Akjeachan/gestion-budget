using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("v_plannification")]
    public class v_Plannification
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
        public string? plan_description { get; set; }
        public int? plan_createdby { get; set; }
        public String? plan_ref { get; set; }

        public string? prod_name { get; set; }
        public string? dept_name { get; set; }
        public string? user_name { get; set; }

        public int? real_id { get; set; }
        public int? real_plannificationid { get; set; }
        public DateTime? real_daterealisation { get; set; }
        public decimal? real_prixunitaire { get; set; }
        public decimal? real_montantreel { get; set; }
        public int? real_actionid { get; set; }
        public string? real_description { get; set; }
        public string? real_image { get; set; }

        public int? budget_id { get; set; }
        public string? budget_code { get; set; }
        public int? budget_plannificationid { get; set; }
        public decimal? budget_montant { get; set; }
        public DateTime? budget_datecreation { get; set; }

        public int? etatp_id { get; set; }
        public string? etatp_name { get; set; }
        public int? etatr_id { get; set; }
        public string? etatr_name { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("v_realisation")]
    public class V_Realisation
    {
        [Key]
        public int plan_id { get; set; }
        public DateTime plan_dateecheance { get; set; }
        public DateTime plan_dateupdate { get; set; }
        public DateTime plan_datecreation { get; set; }
        public int plan_etatactionid { get; set; }
        public int plan_produitid { get; set; }
        public int plan_nombredemande { get; set; }
        public decimal plan_prixunitaire { get; set; }
        public decimal plan_montanttotal { get; set; }
        public decimal? real_prixunitaire { get; set; }
        public decimal? real_montantreel { get; set; }
        public String? plan_description { get; set; }
        public int? plan_createdby { get; set; }
        public String? prod_name { get; set; }
        public String? dept_name { get; set; }
        public String? real_image { get; set; }
        public int? real_actionid { get; set; }
        public int real_id { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("plannification")]
    public class Plannification
    {
        [Key]
        public int plan_id { get; set; }
        public DateTime plan_dateupdate { get; set; }
        public DateTime plan_datecreation { get; set; }
        public int plan_etatactionid { get; set; }
        public int plan_produitid { get; set; }
        public int plan_nombredemande { get; set; }
        public decimal plan_prixunitaire { get; set; }
        public decimal plan_montanttotal { get; set; }
        public String? plan_description { get; set; }
        public int? plan_createdby { get; set; }
        public String? plan_ref { get; set; }
    }
}

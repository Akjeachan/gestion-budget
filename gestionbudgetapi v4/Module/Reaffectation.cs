using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("reaffectation")]
    public class Reaffectation
    {
        [Key]
        public int reaffect_id { get; set; }
        public DateTime reaffect_datereaffectation { get; set; }
        public int reaffect_budget1id { get; set; }
        public int reaffect_budget2id { get; set; }
        public decimal reaffect_montantreaffectation { get; set; }
        public String? reaffect_description { get; set; }
        public bool? reaffect_etat { get; set; }
    }
}
